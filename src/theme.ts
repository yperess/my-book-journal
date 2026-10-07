import { createTheme } from '@mui/material/styles';

// Material 3 inspired palette (baseline purple tonal palette).
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#6750A4', light: '#EADDFF', dark: '#4F378B', contrastText: '#FFFFFF' },
        secondary: { main: '#625B71', light: '#E8DEF8', dark: '#4A4458', contrastText: '#FFFFFF' },
        error: { main: '#B3261E' },
        background: { default: '#FEF7FF', paper: '#FFFFFF' },
        text: { primary: '#1D1B20', secondary: '#49454F' },
        divider: '#CAC4D0',
      },
    },
    dark: {
      palette: {
        primary: { main: '#D0BCFF', light: '#EADDFF', dark: '#4F378B', contrastText: '#381E72' },
        secondary: { main: '#CCC2DC', light: '#4A4458', dark: '#332D41', contrastText: '#332D41' },
        error: { main: '#F2B8B5' },
        background: { default: '#141218', paper: '#211F26' },
        text: { primary: '#E6E0E9', secondary: '#CAC4D0' },
        divider: '#49454F',
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto Flex", Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0.1 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 20, paddingInline: 24 } } },
    MuiFab: { styleOverrides: { root: { borderRadius: 16, textTransform: 'none' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          backgroundColor: theme.vars.palette.background.paper,
          border: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 28 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
  },
});

/** Hue goes from red (0) to green (10). */
export function ratingColor(rating: number): string {
  const hue = Math.round((rating / 10) * 130);
  return `hsl(${hue} 60% 42%)`;
}
