import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import type { BookFilter, SortKey } from '../types';
import { DEFAULT_FILTER, isFilterActive } from '../lib/filter';
import FilterChip from './FilterChip';
import { formatRating } from './RatingBadge';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Recently added',
  dateRead: 'Date read',
  ratingDesc: 'Highest rated',
  ratingAsc: 'Lowest rated',
  title: 'Title',
};

interface Props {
  filter: BookFilter;
  onChange: (f: BookFilter) => void;
  /** Tags with usage counts, most used first. */
  tagCounts: [string, number][];
}

export default function FilterBar({ filter, onChange, tagCounts }: Props) {
  const [ratingAnchor, setRatingAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const set = (patch: Partial<BookFilter>) => onChange({ ...filter, ...patch });
  const ratingActive = filter.minRating > 0 || filter.maxRating < 10;
  const toggleTag = (t: string) =>
    set({ tags: filter.tags.includes(t) ? filter.tags.filter((x) => x !== t) : [...filter.tags, t] });

  return (
    <Stack spacing={1.5}>
      <TextField
        fullWidth
        placeholder="Search title, author, review or tag"
        value={filter.text}
        onChange={(e) => set({ text: e.target.value })}
        slotProps={{
          input: {
            sx: { borderRadius: 7, bgcolor: 'background.paper' },
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filter.text ? (
              <InputAdornment position="end">
                <IconButton aria-label="Clear search" onClick={() => set({ text: '' })} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
          htmlInput: { 'aria-label': 'Search books' },
        }}
      />

      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          icon={<StarRoundedIcon />}
          label={ratingActive ? `${formatRating(filter.minRating)}–${formatRating(filter.maxRating)}` : 'Rating'}
          color={ratingActive ? 'primary' : 'default'}
          variant={ratingActive ? 'filled' : 'outlined'}
          onClick={(e) => setRatingAnchor(e.currentTarget)}
          onDelete={ratingActive ? () => set({ minRating: 0, maxRating: 10 }) : (e) => setRatingAnchor(e.currentTarget)}
          deleteIcon={ratingActive ? undefined : <ArrowDropDownIcon />}
        />
        <Chip
          icon={<SortIcon />}
          label={SORT_LABELS[filter.sort]}
          variant="outlined"
          onClick={(e) => setSortAnchor(e.currentTarget)}
          onDelete={(e) => setSortAnchor(e.currentTarget)}
          deleteIcon={<ArrowDropDownIcon />}
        />
        {filter.tags.length > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter.tagMode}
            onChange={(_, v) => v && set({ tagMode: v })}
            aria-label="Tag match mode"
            sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, borderRadius: 2 } }}
          >
            <ToggleButton value="any">Any tag</ToggleButton>
            <ToggleButton value="all">All tags</ToggleButton>
          </ToggleButtonGroup>
        )}
        {isFilterActive(filter) && (
          <Button size="small" onClick={() => onChange({ ...DEFAULT_FILTER, sort: filter.sort })}>
            Clear filters
          </Button>
        )}
      </Stack>

      {tagCounts.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            scrollbarWidth: 'thin',
            maskImage: 'linear-gradient(to right, black 92%, transparent)',
          }}
        >
          {tagCounts.map(([t, n]) => {
            const selected = filter.tags.includes(t);
            return (
              <FilterChip
                key={t}
                label={`${t} · ${n}`}
                selected={selected}
                onClick={() => toggleTag(t)}
                sx={{ flexShrink: 0 }}
              />
            );
          })}
        </Box>
      )}

      <Popover
        open={!!ratingAnchor}
        anchorEl={ratingAnchor}
        onClose={() => setRatingAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 3, pb: 2, width: 300, borderRadius: 4 } } }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Rating between {formatRating(filter.minRating)} and {formatRating(filter.maxRating)}
        </Typography>
        <Slider
          value={[filter.minRating, filter.maxRating]}
          onChange={(_, v) => {
            const [minRating, maxRating] = v as number[];
            set({ minRating, maxRating });
          }}
          min={0}
          max={10}
          step={0.5}
          marks={[0, 2, 4, 6, 8, 10].map((value) => ({ value, label: String(value) }))}
          valueLabelDisplay="auto"
          getAriaLabel={(i) => (i === 0 ? 'Minimum rating' : 'Maximum rating')}
          disableSwap
        />
      </Popover>

      <Menu anchorEl={sortAnchor} open={!!sortAnchor} onClose={() => setSortAnchor(null)}>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <MenuItem
            key={k}
            selected={filter.sort === k}
            onClick={() => {
              set({ sort: k });
              setSortAnchor(null);
            }}
          >
            {SORT_LABELS[k]}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
