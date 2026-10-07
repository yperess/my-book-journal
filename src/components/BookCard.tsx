import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Book } from '../types';
import BookCover from './BookCover';
import RatingBadge from './RatingBadge';

interface Props {
  book: Book;
  onOpen: (book: Book) => void;
  onTagClick: (tag: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BookCard({ book, onOpen, onTagClick }: Props) {
  const meta = [book.authors.join(', '), book.firstPublishYear].filter(Boolean).join(' · ');
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea
        onClick={() => onOpen(book)}
        sx={{ height: '100%', p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}
      >
        <BookCover coverId={book.coverId} title={book.title} width={76} />
        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
                {book.title}
              </Typography>
              {meta && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {meta}
                </Typography>
              )}
              {book.dateRead && (
                <Typography variant="caption" color="text.secondary">
                  Read {formatDate(book.dateRead)}
                </Typography>
              )}
            </Stack>
            <RatingBadge rating={book.rating} />
          </Stack>
          {book.review && (
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-line',
              }}
            >
              {book.review}
            </Typography>
          )}
          {book.tags.length > 0 && (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, pt: 0.5 }}>
              {book.tags.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  variant="outlined"
                  component="span"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(t);
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
