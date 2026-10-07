import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../hooks/AuthContext';
import { CLIENT_ID } from '../lib/google';

export default function SignInScreen() {
  const { signIn, signingIn, error } = useAuth();
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper
        variant="outlined"
        sx={{ maxWidth: 440, width: '100%', p: { xs: 3, sm: 5 }, borderRadius: 7, textAlign: 'center' }}
      >
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: 6,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <AutoStoriesRoundedIcon sx={{ fontSize: 52 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
              My Book Journal
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Rate, review and tag every book you read. Your journal lives in a Google Sheet in your own Drive.
            </Typography>
          </Box>
          {!CLIENT_ID && (
            <Alert severity="warning" sx={{ textAlign: 'left' }}>
              <code>VITE_GOOGLE_CLIENT_ID</code> is not set. See the README for setup instructions.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ textAlign: 'left', width: '100%' }}>
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={signIn}
            loading={signingIn}
            disabled={!CLIENT_ID}
            sx={{ py: 1.25 }}
          >
            Sign in with Google
          </Button>
          <Typography variant="caption" color="text.secondary">
            The app only asks for access to files it creates (the <code>drive.file</code> scope); it can’t see anything
            else in your Drive.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
