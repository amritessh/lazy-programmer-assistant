import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  GitHub,
  Google
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = isSignUp
        ? await signUp(formData.email, formData.password)
        : await signIn(formData.email, formData.password);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error?.message || 'Authentication failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);

    try {
      // This would typically call the auth service for social login
      console.log(`Signing in with ${provider}`);
      toast.error(`${provider} login not implemented yet`);
    } catch (error) {
      setError(`Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: theme.shadows[8],
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant='h4'
              component='h1'
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {isSignUp
                ? 'Sign up to start building amazing projects'
                : 'Sign in to continue to your workspace'}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Social Login Buttons */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant='outlined'
              startIcon={<Google />}
              onClick={() => handleSocialLogin('Google')}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Continue with Google
            </Button>
            <Button
              fullWidth
              variant='outlined'
              startIcon={<GitHub />}
              onClick={() => handleSocialLogin('GitHub')}
              disabled={loading}
            >
              Continue with GitHub
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant='body2' color='text.secondary'>
              or continue with email
            </Typography>
          </Divider>

          {/* Login Form */}
          <Box component='form' onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label='Email'
              type='email'
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              margin='normal'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Email color='action' />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label='Password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              margin='normal'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Lock color='action' />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge='end'
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {isSignUp && (
              <TextField
                fullWidth
                label='Confirm Password'
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                required
                margin='normal'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Lock color='action' />
                    </InputAdornment>
                  )
                }}
              />
            )}

            <Button
              type='submit'
              fullWidth
              variant='contained'
              size='large'
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </Box>

          {/* Toggle Sign Up/Sign In */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant='body2' color='text.secondary'>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link
                component='button'
                variant='body2'
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setFormData({ email: '', password: '', confirmPassword: '' });
                }}
                sx={{ textDecoration: 'none' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Link>
            </Typography>
          </Box>

          {/* Forgot Password */}
          {!isSignUp && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component='button'
                variant='body2'
                onClick={() => {
                  // Handle forgot password
                  console.log('Forgot password clicked');
                }}
                sx={{ textDecoration: 'none' }}
              >
                Forgot your password?
              </Link>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
