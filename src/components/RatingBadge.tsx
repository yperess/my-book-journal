import Box from '@mui/material/Box';
import { ratingColor } from '../theme';

export function formatRating(r: number): string {
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export default function RatingBadge({ rating, size = 44 }: { rating: number; size?: number }) {
  return (
    <Box
      aria-label={`Rated ${formatRating(rating)} out of 10`}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: ratingColor(rating),
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        boxShadow: 1,
      }}
    >
      {formatRating(rating)}
    </Box>
  );
}
