import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import api from '../services/api';

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.access_token, data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to the authentication server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, #e2e8f0 100%)`,
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Logo Brand Icon */}
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: '12px',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              fontWeight: 800,
              fontSize: '1.5rem',
              mb: 2,
            }}
          >
            CW
          </Box>

          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            CronWatch
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
            Enter your credentials to access the monitoring portal
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: '6px' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlined sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 4,
                mb: 2,
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthPage;
