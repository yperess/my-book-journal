# My Book Journal

A Material Design progressive web app for keeping track of the books you read.

- **Sign in with Google**: your data lives in a Google Sheet ("My Book Journal") that the app creates in your Drive.
  It uses only the `drive.file` scope, so it can see the files it created and nothing else.
- **Add books** by searching [Open Library](https://openlibrary.org) (covers come from `covers.openlibrary.org`),
  or enter a book by hand if Open Library doesn't list it.
- **Rate** each book 0–10 (half points allowed), write a **review**, and pick **tags** for how it made you feel
  (funny, romantic, vulgar, …). You can add your own tags from the editor or from *Manage tags*.
- **Browse** your books in a list. **Search and filter** by text, rating range and tags (match any or all),
  and sort by date added, date read, rating or title.
- Installable as an app. You can browse offline because the last synced copy is cached locally. Light and dark themes.

Built with React 19, TypeScript, MUI (Material UI), Vite and `vite-plugin-pwa`.

## Google Cloud setup

1. In the [Google Cloud console](https://console.cloud.google.com/), create a project or pick an existing one.
2. **APIs & Services → Library**: enable the **Google Sheets API** and the **Google Drive API**.
3. **APIs & Services → OAuth consent screen**: set it up (External is fine) and add the scopes
   `openid`, `email`, `profile` and `https://www.googleapis.com/auth/drive.file`. While the app is in
   *Testing* mode, add your Google account under *Test users*.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
   Under *Authorized JavaScript origins*, add every origin the app is served from, e.g.
   `http://localhost:5173`, `http://localhost:4173` and `https://<user>.github.io`.
   You don't need redirect URIs because the app uses the Google Identity Services popup token flow.
5. Copy the client ID into `.env` (`VITE_GOOGLE_CLIENT_ID`). The repo's `.env` already holds the client ID for this
   project's own Google Cloud project; a client ID is public (it ships in the app's JavaScript), so it is safe to commit.

## Running locally

```bash
npm install
npm run dev                  # http://localhost:5173
```

To use a different OAuth client locally, put `VITE_GOOGLE_CLIENT_ID=...` in `.env.local`, which overrides `.env`.

Other scripts: `npm test` (unit tests), `npm run typecheck`, `npm run build`, `npm run preview`.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` tests and builds every push and PR, and deploys `main` to GitHub Pages.

1. Repository **Settings → Pages → Source**: *GitHub Actions*.
2. Add `https://<user>.github.io` to the OAuth client's authorized JavaScript origins.

The build is served from `/<repo-name>/`. Set `BASE_PATH` when building for a different sub-path.

## Data format

The spreadsheet has two sheets. You can also view or edit them by hand:

| Sheet   | Columns |
| ------- | ------- |
| `Books` | `id`, `title`, `authors` (separated by `; `), `olKey`, `coverId`, `firstPublishYear`, `rating`, `review`, `tags` (separated by `, `), `dateRead`, `createdAt`, `updatedAt` |
| `Tags`  | `tag`: your tag list, seeded with defaults the first time you sign in |

The app finds its spreadsheet through a private Drive `appProperties` marker, so you can rename or move the file.

## Notes

- Google access tokens from the browser flow last about an hour. When one expires, the app keeps showing your
  journal and asks you to *Reconnect* before it syncs more changes.
- Deleting a tag in *Manage tags* only removes it from your tag list. Books that already have the tag keep it.
