import { useState } from 'react';
import Box from '@mui/material/Box';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { coverUrl } from '../api/openLibrary';

interface Props {
  coverId: number | null;
  title: string;
  width: number;
  size?: 'S' | 'M' | 'L';
}

export default function BookCover({ coverId, title, width, size = 'M' }: Props) {
  const [failed, setFailed] = useState(false);
  const src = coverUrl(coverId, size);
  const height = Math.round(width * 1.5);
  return (
    <Box
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: 'secondary.light',
        color: 'secondary.dark',
        display: 'grid',
        placeItems: 'center',
        boxShadow: 2,
      }}
    >
      {src && !failed ? (
        <Box
          component="img"
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <MenuBookRoundedIcon sx={{ fontSize: width * 0.45 }} />
      )}
    </Box>
  );
}
