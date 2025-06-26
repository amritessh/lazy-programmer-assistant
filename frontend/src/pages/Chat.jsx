// frontend/src/pages/Chat.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import {
  Add as AddIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Components
import ChatInterface from '@components/Chat/ChatInterface';

// Hooks
import { useChat } from '@hooks/useChat';
import { useProject } from '@contexts/ProjectContext';

const Chat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { createSession, sessions, loading } = useChat();
  const { currentProject } = useProject();

  // Create new session if none exists
  const handleNewChat = async () => {
    try {
      await createSession('New Chat', currentProject?.id);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  // If no sessionId and we have sessions, redirect to the latest
  useEffect(() => {
    if (!sessionId && sessions.length > 0 && !loading) {
      const latestSession = sessions[0]; // Sessions are ordered by updated_at desc
      navigate(`/chat/${latestSession.id}`, { replace: true });
    }
  }, [sessionId, sessions, loading, navigate]);

  // Show empty state if no session ID and no existing sessions
  if (!sessionId && sessions.length === 0 && !loading) {
    return (
      <Container maxWidth='md' sx={{ py: 8, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 6,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3
            }}
          >
            <PsychologyIcon
              sx={{
                fontSize: 80,
                color: 'primary.main',
                mb: 3,
                filter: 'drop-shadow(0 4px 8px rgba(99, 102, 241, 0.3))'
              }}
            />

            <Typography variant='h3' gutterBottom sx={{ fontWeight: 700 }}>
              Welcome to Your
            </Typography>
            <Typography
              variant='h3'
              gutterBottom
              className='text-gradient'
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Lazy Programmer's Assistant
            </Typography>

            <Typography
              variant='h6'
              color='text.secondary'
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              I specialize in understanding your vague requests and turning them
              into working code. Ready to be productively lazy?
            </Typography>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant='contained'
                size='large'
                startIcon={<AddIcon />}
                onClick={handleNewChat}
                disabled={loading}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                  }
                }}
              >
                Start Your First Chat
              </Button>
            </motion.div>

            <Box
              sx={{
                mt: 4,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center'
              }}
            >
              <Paper
                sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}
              >
                <Typography variant='body2' color='text.secondary'>
                  💬 <strong>Say things like:</strong> "make the thing work",
                  "fix the broken stuff", "add a button"
                </Typography>
              </Paper>
              <Paper
                sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}
              >
                <Typography variant='body2' color='text.secondary'>
                  🎤 <strong>Voice support:</strong> Just click the mic and
                  speak your vague requests
                </Typography>
              </Paper>
              <Paper
                sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}
              >
                <Typography variant='body2' color='text.secondary'>
                  😏 <strong>Adjustable sass:</strong> Control how snarky I get
                  about your vague requests
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  // Show loading state
  if (loading && !sessionId) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <PsychologyIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        </motion.div>
        <Typography variant='body1' color='text.secondary'>
          Loading your chat...
        </Typography>
      </Box>
    );
  }

  // Show chat interface if we have a session ID
  if (sessionId) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChatInterface sessionId={sessionId} />
      </Box>
    );
  }

  return null;
};

export default Chat;
