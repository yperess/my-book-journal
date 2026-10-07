import type { UserProfile } from '../types';

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const SCOPES = ['openid', 'email', 'profile', DRIVE_FILE_SCOPE].join(' ');
const SESSION_KEY = 'bookJournal.session';

export const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';

export interface Session {
  accessToken: string;
  /** epoch millis */
  expiresAt: number;
  user: UserProfile;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage may be unavailable (private mode); the session just won't persist.
  }
}

export function isSessionValid(s: Session | null): s is Session {
  return !!s && s.expiresAt - Date.now() > 60_000;
}

/** Resolves once the GIS script (loaded async in index.html) is ready. */
function waitForGis(timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (typeof google !== 'undefined' && google.accounts?.oauth2) resolve();
      else if (Date.now() - start > timeoutMs) reject(new AuthError('Could not load Google sign-in. Check your connection.'));
      else setTimeout(tick, 100);
    };
    tick();
  });
}

async function fetchProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new AuthError('Could not read your Google profile.');
  const data = (await res.json()) as { email?: string; name?: string; picture?: string };
  return { email: data.email ?? '', name: data.name ?? data.email ?? '', picture: data.picture ?? '' };
}

/**
 * Opens the Google consent popup and returns a new session. Must be called from a user
 * gesture (click), otherwise browsers block the popup.
 */
export async function signIn(loginHint?: string): Promise<Session> {
  if (!CLIENT_ID) throw new AuthError('VITE_GOOGLE_CLIENT_ID is not configured.');
  await waitForGis();
  const token = await new Promise<google.accounts.oauth2.TokenResponse>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) reject(new AuthError(resp.error_description || resp.error));
        else resolve(resp);
      },
      error_callback: (err) =>
        reject(new AuthError(err.type === 'popup_closed' ? 'Sign-in was cancelled.' : err.message || 'Sign-in failed.')),
    });
    client.requestAccessToken({ prompt: loginHint ? '' : 'consent', login_hint: loginHint });
  });
  if (!google.accounts.oauth2.hasGrantedAllScopes(token, DRIVE_FILE_SCOPE)) {
    throw new AuthError('Google Drive access is required to store your journal. Please allow it and try again.');
  }
  const user = await fetchProfile(token.access_token);
  const session: Session = {
    accessToken: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in) * 1000,
    user,
  };
  saveSession(session);
  return session;
}

export function signOut(session: Session | null) {
  if (session && typeof google !== 'undefined' && google.accounts?.oauth2) {
    google.accounts.oauth2.revoke(session.accessToken);
  }
  saveSession(null);
}
