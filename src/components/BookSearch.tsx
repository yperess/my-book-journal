import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { searchBooks, type OpenLibraryResult } from '../api/openLibrary';
import BookCover from './BookCover';

interface Props {
  onSelect: (result: OpenLibraryResult) => void;
  onManual: (title: string) => void;
}

export default function BookSearch({ onSelect, onManual }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchBooks(q, controller.signal));
        setError(null);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <Stack spacing={2} sx={{ minHeight: 0, flex: 1 }}>
      <TextField
        autoFocus
        fullWidth
        label="Search Open Library"
        placeholder="Title, author or ISBN"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <Box sx={{ height: 4 }}>{loading && <LinearProgress />}</Box>
      {error && <Alert severity="error">{error}</Alert>}
      <List disablePadding sx={{ overflowY: 'auto', flex: 1 }}>
        {results.map((r) => (
          <ListItemButton key={r.key} onClick={() => onSelect(r)} sx={{ gap: 2, borderRadius: 3, alignItems: 'flex-start' }}>
            <BookCover coverId={r.coverId} title={r.title} width={44} size="S" />
            <ListItemText
              primary={r.title}
              secondary={[r.authors.slice(0, 3).join(', '), r.firstPublishYear].filter(Boolean).join(' · ')}
              slotProps={{ primary: { sx: { fontWeight: 500 } } }}
            />
          </ListItemButton>
        ))}
        {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No matches on Open Library.
          </Typography>
        )}
      </List>
      <Button startIcon={<EditNoteIcon />} onClick={() => onManual(query.trim())} sx={{ alignSelf: 'center' }}>
        Can’t find it? Enter the book manually
      </Button>
    </Stack>
  );
}
