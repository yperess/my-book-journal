import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import * as gauth from '../lib/google';
import type { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  /** True when we know who the user is but their access token expired. */
  expired: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  markExpired: () => void;
  getToken: () => string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<gauth.Session | null>(() => gauth.loadSession());
  const [expired, setExpired] = useState(() => !gauth.isSessionValid(session));
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setError(null);
    try {
      const s = await gauth.signIn(sessionRef.current?.user.email);
      setSession(s);
      setExpired(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    gauth.signOut(sessionRef.current);
    setSession(null);
    setExpired(false);
  }, []);

  const markExpired = useCallback(() => setExpired(true), []);

  const getToken = useCallback(() => {
    const s = sessionRef.current;
    if (!gauth.isSessionValid(s)) {
      setExpired(true);
      throw new gauth.AuthError('Your Google session expired.');
    }
    return s.accessToken;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user: session?.user ?? null, expired, signingIn, error, signIn, signOut, markExpired, getToken }),
    [session, expired, signingIn, error, signIn, signOut, markExpired, getToken],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
