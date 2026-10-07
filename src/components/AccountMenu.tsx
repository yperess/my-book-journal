import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useColorScheme } from '@mui/material/styles';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import SellIcon from '@mui/icons-material/SellOutlined';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import TableChartIcon from '@mui/icons-material/TableChartOutlined';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  spreadsheetUrl: string | null;
  onManageTags: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
}

export default function AccountMenu({ user, spreadsheetUrl, onManageTags, onRefresh, onSignOut }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { mode, setMode } = useColorScheme();
  const close = () => setAnchor(null);
  const item = (fn: () => void) => () => {
    close();
    fn();
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu">
        <Avatar src={user.picture} alt={user.name} sx={{ width: 36, height: 36 }} slotProps={{ img: { referrerPolicy: 'no-referrer' } }}>
          {user.name.charAt(0)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 260, borderRadius: 3 } } }}
      >
        <MenuItem disabled sx={{ '&.Mui-disabled': { opacity: 1 } }}>
          <ListItemText primary={user.name} secondary={user.email} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={item(onManageTags)}>
          <ListItemIcon>
            <SellIcon />
          </ListItemIcon>
          Manage tags
        </MenuItem>
        {spreadsheetUrl && (
          <MenuItem component="a" href={spreadsheetUrl} target="_blank" rel="noopener" onClick={close}>
            <ListItemIcon>
              <TableChartIcon />
            </ListItemIcon>
            Open spreadsheet
          </MenuItem>
        )}
        <MenuItem onClick={item(onRefresh)}>
          <ListItemIcon>
            <RefreshIcon />
          </ListItemIcon>
          Refresh
        </MenuItem>
        <Divider />
        <MenuItem disableRipple sx={{ '&:hover': { bgcolor: 'transparent' }, cursor: 'default' }}>
          <ToggleButtonGroup
            fullWidth
            size="small"
            exclusive
            value={mode ?? 'system'}
            onChange={(_, v) => v && setMode(v)}
            aria-label="Theme"
          >
            <ToggleButton value="light" aria-label="Light theme">
              <LightModeIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="system" aria-label="System theme">
              <SettingsBrightnessIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="dark" aria-label="Dark theme">
              <DarkModeIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <Divider />
        <MenuItem onClick={item(onSignOut)}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
