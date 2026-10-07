import Chip, { type ChipProps } from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';

/** Material 3 style filter chip: outlined when off, tonal "secondary container" with a check when on. */
export default function FilterChip({ selected, sx, ...props }: ChipProps & { selected: boolean }) {
  return (
    <Chip
      {...props}
      aria-pressed={selected}
      icon={selected ? <CheckIcon /> : undefined}
      variant={selected ? 'filled' : 'outlined'}
      sx={[
        selected && {
          bgcolor: 'secondary.light',
          color: 'text.primary',
          border: '1px solid transparent',
          '& .MuiChip-icon': { color: 'inherit' },
          '&&:hover, &&.Mui-focusVisible': { bgcolor: 'secondary.light', filter: 'brightness(0.96)' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
