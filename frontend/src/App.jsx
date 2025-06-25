// frontend/src/App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from '@contexts/AuthContext';
import { ProjectProvider } from '@contexts/ProjectContext';

// Components
import Layout from '@components/Layout/Layout';
import ProtectedRoute from '@components/Auth/ProtectedRoute';

// Pages
import Login from '@pages/Auth/Login';
import Dashboard from '@pages/Dashboard';
import Chat from '@pages/Chat';
import Projects from '@pages/Projects';
import Settings from '@pages/Settings';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5'
    },
    secondary: {
      main: '#ec4899', // Pink for sass
      light: '#f472b6',
      dark: '#db2777'
    },
    background: {
      default: '#0f172a', // Dark slate
      paper: '#1e293b'
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1'
    },
    success: {
      main: '#10b981'
    },
    warning: {
      main: '#f59e0b'
    },
    error: {
      main: '#ef4444'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    },
    button: {
      textTransform: 'none',
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontSize: '0.95rem'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProjectProvider>
          <Router>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
              }}
            >
              <Routes>
                {/* Public routes */}
                <Route path='/login' element={<Login />} />

                {/* Protected routes */}
                <Route
                  path='/'
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to='/dashboard' replace />} />
                  <Route path='dashboard' element={<Dashboard />} />
                  <Route path='chat' element={<Chat />} />
                  <Route path='chat/:sessionId' element={<Chat />} />
                  <Route path='projects' element={<Projects />} />
                  <Route path='settings' element={<Settings />} />
                </Route>

                {/* Catch all route */}
                <Route
                  path='*'
                  element={<Navigate to='/dashboard' replace />}
                />
              </Routes>
            </Box>
          </Router>

          {/* Global toast notifications */}
          <Toaster
            position='bottom-right'
            toastOptions={{
              duration: 4000,
              style: {
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              },
              success: {
                iconTheme: {
                  primary: theme.palette.success.main,
                  secondary: theme.palette.background.paper
                }
              },
              error: {
                iconTheme: {
                  primary: theme.palette.error.main,
                  secondary: theme.palette.background.paper
                }
              }
            }}
          />
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
