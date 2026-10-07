import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { normalizeTag } from '../lib/tags';

interface Props {
  open: boolean;
  tags: string[];
  counts: Map<string, number>;
  onClose: () => void;
  onAdd: (tags: string[]) => Promise<void>;
  onDelete: (tag: string) => Promise<void>;
}

export default function TagManager({ open, tags, counts, onClose, onAdd, onDelete }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const add = () => {
    const t = normalizeTag(value);
    if (!t) return;
    if (tags.includes(t)) {
      setError(`"${t}" already exists.`);
      return;
    }
    void act('+', async () => {
      await onAdd([t]);
      setValue('');
    });
  };

  const sorted = [...tags].sort((a, b) => a.localeCompare(b));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Your tags</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tags describe how a book made you feel. Removing a tag here keeps it on books that already use it.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small"
            label="New tag"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={add} loading={busy === '+'} disabled={!normalizeTag(value)}>
            Add
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ my: 1 }}>
            {error}
          </Alert>
        )}
        <List dense>
          {sorted.map((t) => (
            <ListItem
              key={t}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`Delete tag ${t}`}
                  disabled={busy !== null}
                  onClick={() => act(t, () => onDelete(t))}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={t}
                secondary={`${counts.get(t) ?? 0} book${counts.get(t) === 1 ? '' : 's'}`}
                sx={{ opacity: busy === t ? 0.5 : 1 }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
