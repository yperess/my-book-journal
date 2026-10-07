import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { OpenLibraryResult } from '../api/openLibrary';
import { workUrl } from '../api/openLibrary';
import { normalizeTag, uniqueTags } from '../lib/tags';
import type { Book, BookDraft } from '../types';
import BookCover from './BookCover';
import BookSearch from './BookSearch';
import FilterChip from './FilterChip';
import RatingBadge, { formatRating } from './RatingBadge';

interface Props {
  open: boolean;
  /** Book to edit; undefined to add a new one. */
  book?: Book;
  accountTags: string[];
  onClose: () => void;
  onSave: (draft: BookDraft, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

function emptyDraft(): BookDraft {
  return {
    title: '',
    authors: [],
    olKey: '',
    coverId: null,
    firstPublishYear: null,
    rating: 7,
    review: '',
    tags: [],
    dateRead: today(),
  };
}

function draftFrom(book: Book): BookDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...draft } = book;
  return draft;
}

const RATING_WORDS = ['Awful', 'Awful', 'Bad', 'Poor', 'Meh', 'OK', 'Decent', 'Good', 'Great', 'Excellent', 'Masterpiece'];

export default function BookEditor({ open, book, accountTags, onClose, onSave, onDelete }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [draft, setDraft] = useState<BookDraft>(emptyDraft);
  const [authorsText, setAuthorsText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const d = book ? draftFrom(book) : emptyDraft();
    setDraft(d);
    setAuthorsText(d.authors.join(', '));
    setStep(book ? 'form' : 'search');
    setNewTag('');
    setError(null);
    setSaving(false);
    setConfirmDelete(false);
  }, [open, book]);

  const set = (patch: Partial<BookDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const pick = (r: OpenLibraryResult) => {
    set({ title: r.title, authors: r.authors, olKey: r.key, coverId: r.coverId, firstPublishYear: r.firstPublishYear });
    setAuthorsText(r.authors.join(', '));
    setStep('form');
  };

  const manual = (title: string) => {
    set({ title, authors: [], olKey: '', coverId: null, firstPublishYear: null });
    setAuthorsText('');
    setStep('form');
  };

  const toggleTag = (t: string) =>
    set({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] });

  const addCustomTag = () => {
    const t = normalizeTag(newTag);
    if (t && !draft.tags.includes(t)) set({ tags: [...draft.tags, t] });
    setNewTag('');
  };

  // Account tags first, then any new ones only used on this book.
  const tagOptions = uniqueTags([...accountTags, ...draft.tags]);

  const save = async () => {
    if (!draft.title.trim()) {
      setError('A title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const authors = authorsText.split(',').map((a) => a.trim()).filter(Boolean);
      // Include a pending custom tag the user typed but didn't press "add" for.
      const pending = normalizeTag(newTag);
      await onSave({ ...draft, authors, tags: pending ? uniqueTags([...draft.tags, pending]) : draft.tags }, book?.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!book) return;
    setSaving(true);
    try {
      await onDelete(book.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="book-editor-title"
      slotProps={{ paper: { sx: { height: fullScreen ? undefined : 'min(820px, 90vh)', ...(fullScreen && { borderRadius: 0 }) } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        {step === 'form' && !book && (
          <IconButton aria-label="Back to search" onClick={() => setStep('search')} edge="start">
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box id="book-editor-title" sx={{ flex: 1 }}>{book ? 'Edit book' : step === 'search' ? 'Add a book' : 'Rate & review'}</Box>
        <IconButton aria-label="Close" onClick={onClose} disabled={saving}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column' }}>
        {step === 'search' ? (
          <BookSearch onSelect={pick} onManual={manual} />
        ) : (
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <BookCover coverId={draft.coverId} title={draft.title} width={96} size="L" />
              <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  label="Title"
                  required
                  value={draft.title}
                  onChange={(e) => set({ title: e.target.value })}
                  size="small"
                />
                <TextField
                  label="Authors"
                  helperText="Separate multiple authors with commas"
                  value={authorsText}
                  onChange={(e) => setAuthorsText(e.target.value)}
                  size="small"
                />
                {draft.olKey && (
                  <Link href={workUrl(draft.olKey)} target="_blank" rel="noopener" variant="body2">
                    View on Open Library
                  </Link>
                )}
              </Stack>
            </Stack>

            <Box>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1 }}>
                <RatingBadge rating={draft.rating} size={56} />
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    Your rating
                  </Typography>
                  <Typography variant="h6">{RATING_WORDS[Math.floor(draft.rating)]}</Typography>
                </Box>
              </Stack>
              <Slider
                value={draft.rating}
                onChange={(_, v) => set({ rating: v as number })}
                min={0}
                max={10}
                step={0.5}
                marks={Array.from({ length: 11 }, (_, value) => ({ value, label: String(value) }))}
                valueLabelDisplay="auto"
                valueLabelFormat={formatRating}
                aria-label="Rating from 0 to 10"
              />
            </Box>

            <TextField
              label="Date read"
              type="date"
              value={draft.dateRead}
              onChange={(e) => set({ dateRead: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ maxWidth: 220 }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                How did it make you feel?
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                {tagOptions.map((t) => {
                  const selected = draft.tags.includes(t);
                  return (
                    <FilterChip key={t} label={t} selected={selected} onClick={() => toggleTag(t)} />
                  );
                })}
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="Custom tag"
                  placeholder="e.g. tear-jerker"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addCustomTag} disabled={!normalizeTag(newTag)}>
                  Add
                </Button>
              </Stack>
            </Box>

            <TextField
              label="Review"
              placeholder="What did you think?"
              multiline
              minRows={4}
              value={draft.review}
              onChange={(e) => set({ review: e.target.value })}
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>

      {step === 'form' && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          {book &&
            (confirmDelete ? (
              <Button color="error" variant="contained" onClick={remove} disabled={saving}>
                Confirm delete
              </Button>
            ) : (
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setConfirmDelete(true)} disabled={saving}>
                Delete
              </Button>
            ))}
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={save} loading={saving}>
            Save
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
