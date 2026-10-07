import { useDeferredValue, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import AccountMenu from './components/AccountMenu';
import BookCard from './components/BookCard';
import BookEditor from './components/BookEditor';
import FilterBar from './components/FilterBar';
import SignInScreen from './components/SignInScreen';
import TagManager from './components/TagManager';
import { useAuth } from './hooks/AuthContext';
import { JournalProvider, useJournal } from './hooks/JournalContext';
import { DEFAULT_FILTER, filterBooks, isFilterActive, tagCounts } from './lib/filter';
import type { Book, BookFilter } from './types';

export default function App() {
  const { user } = useAuth();
  if (!user) return <SignInScreen />;
  return (
    <JournalProvider>
      <Journal />
    </JournalProvider>
  );
}

function Journal() {
  const { user, expired, signIn, signingIn, signOut, error: authError } = useAuth();
  const journal = useJournal();
  const [filter, setFilter] = useState<BookFilter>(DEFAULT_FILTER);
  const deferredFilter = useDeferredValue(filter);
  const [editing, setEditing] = useState<{ book?: Book } | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);

  const counts = useMemo(() => tagCounts(journal.books), [journal.books]);
  const sortedTagCounts = useMemo(
    () => [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [counts],
  );
  const visible = useMemo(() => filterBooks(journal.books, deferredFilter), [journal.books, deferredFilter]);
  const loading = journal.status === 'loading';
  const firstLoad = loading && journal.books.length === 0;
  const avg = journal.books.length
    ? journal.books.reduce((s, b) => s + b.rating, 0) / journal.books.length
    : 0;

  if (!user) return null;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', pb: 12 }}>
      <AppBar position="sticky" sx={{ bgcolor: 'background.default', backgroundImage: 'none' }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <AutoStoriesRoundedIcon color="primary" />
          <Typography variant="h6" component="h1" sx={{ flex: 1 }} noWrap>
            My Book Journal
          </Typography>
          <AccountMenu
            user={user}
            spreadsheetUrl={journal.spreadsheetUrl}
            onManageTags={() => setTagsOpen(true)}
            onRefresh={journal.reload}
            onSignOut={signOut}
          />
        </Toolbar>
        <Box sx={{ height: 4 }}>{loading && !firstLoad && <LinearProgress />}</Box>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 1 }}>
        <Stack spacing={2}>
          {expired && (
            <Alert
              severity="info"
              action={
                <Button color="inherit" size="small" onClick={signIn} loading={signingIn}>
                  Reconnect
                </Button>
              }
            >
              Your Google session expired. Reconnect to sync changes{journal.fromCache ? ' (showing saved copy)' : ''}.
              {authError && ` ${authError}`}
            </Alert>
          )}
          {journal.status === 'error' && !expired && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={journal.reload}>
                  Retry
                </Button>
              }
            >
              {journal.error}
            </Alert>
          )}

          {journal.books.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {journal.books.length} book{journal.books.length === 1 ? '' : 's'} · average rating {avg.toFixed(1)}
            </Typography>
          )}

          {journal.books.length > 0 && <FilterBar filter={filter} onChange={setFilter} tagCounts={sortedTagCounts} />}

          {firstLoad ? (
            <Stack sx={{ alignItems: 'center', py: 10 }} spacing={2}>
              <CircularProgress />
              <Typography color="text.secondary">Opening your journal…</Typography>
            </Stack>
          ) : journal.books.length === 0 && journal.status === 'ready' ? (
            <EmptyState onAdd={() => setEditing({})} />
          ) : visible.length === 0 && isFilterActive(filter) ? (
            <Stack sx={{ alignItems: 'center', py: 8, color: 'text.secondary' }} spacing={1}>
              <SearchOffIcon sx={{ fontSize: 48 }} />
              <Typography>No books match these filters.</Typography>
              <Button onClick={() => setFilter({ ...DEFAULT_FILTER, sort: filter.sort })}>Clear filters</Button>
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
              }}
            >
              {visible.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  onOpen={(book) => setEditing({ book })}
                  onTagClick={(t) =>
                    setFilter((f) => (f.tags.includes(t) ? f : { ...f, tags: [...f.tags, t] }))
                  }
                />
              ))}
            </Box>
          )}
        </Stack>
      </Container>

      <Fab
        variant="extended"
        color="primary"
        onClick={() => setEditing({})}
        disabled={journal.status !== 'ready' || expired}
        sx={{
          position: 'fixed',
          right: 'max(24px, env(safe-area-inset-right))',
          bottom: 'max(24px, env(safe-area-inset-bottom))',
          px: 3,
          height: 56,
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add book
      </Fab>

      <BookEditor
        open={!!editing}
        book={editing?.book}
        accountTags={journal.tags}
        onClose={() => setEditing(null)}
        onSave={journal.saveBook}
        onDelete={journal.deleteBook}
      />
      <TagManager
        open={tagsOpen}
        tags={journal.tags}
        counts={counts}
        onClose={() => setTagsOpen(false)}
        onAdd={journal.addTags}
        onDelete={journal.deleteTag}
      />
    </Box>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Stack sx={{ alignItems: 'center', textAlign: 'center', py: 10, px: 2 }} spacing={2}>
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: 'primary.light',
          color: 'primary.dark',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <AutoStoriesRoundedIcon sx={{ fontSize: 64 }} />
      </Box>
      <Typography variant="h5">Your journal is empty</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
        Search Open Library for a book you’ve read, give it a score out of 10, and tag how it made you feel.
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        Add your first book
      </Button>
    </Stack>
  );
}
