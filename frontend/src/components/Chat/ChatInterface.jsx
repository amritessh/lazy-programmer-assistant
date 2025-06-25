// frontend/src/components/Chat/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Settings as SettingsIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import VoiceInput from './VoiceInput';
import LoadingIndicator from './LoadingIndicator';
import SassLevelSlider from './SassLevelSlider';

// Hooks
import { useChat } from '@hooks/useChat';
import { useVoiceInput } from '@hooks/useVoiceInput';
import { useProject } from '@contexts/ProjectContext';

const ChatInterface = ({ sessionId }) => {
  const {
    messages,
    loading,
    error,
    sendMessage,
    currentSession,
    suggestions,
    clearError,
  } = useChat(sessionId);

  const { currentProject } = useProject();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Voice input
  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [sassLevel, setSassLevel] = useState(5);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle voice input transcript
  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    setIsTyping(true);
    
    try {
      await sendMessage(content, {
        sassLevel,
        projectContext: currentProject?.context,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PsychologyIcon color="primary" />
            <Box>
              <Typography variant="h6" component="h1">
                Lazy Programmer's Assistant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentProject ? `Project: ${currentProject.name}` : 'No project selected'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Sass Level Indicator */}
            <Chip
              label={`Sass Level: ${sassLevel}`}
              size="small"
              color="secondary"
              variant="outlined"
            />

            {/* Voice Support Indicator */}
            {voiceSupported && (
              <Chip
                icon={<MicIcon />}
                label="Voice Ready"
                size="small"
                color="success"
                variant="outlined"
              />
            )}

            {/* Settings Toggle */}
            <Tooltip title="Settings">
              <IconButton
                onClick={() => setShowSettings(!showSettings)}
                color={showSettings ? 'primary' : 'default'}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Settings Panel */}
        <Fade in={showSettings}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <SassLevelSlider
              value={sassLevel}
              onChange={setSassLevel}
              sx={{ mb: 2 }}
            />
          </Box>
        </Fade>
      </Paper>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              severity="error"
              action={
                <IconButton size="small" onClick={clearError}>
                  <RefreshIcon />
                </IconButton>
              }
              sx={{ borderRadius: 0 }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'background.default',
          p: 2,
        }}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                mb: 3,
              }}
            >
              <PsychologyIcon
                sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                Welcome to your Lazy Programming Assistant!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                I specialize in understanding vague requests and turning them into working code.
                Try saying things like:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {[
                  'make the thing work',
                  'fix the broken stuff',
                  'add a button that does the thing',
                  'make it pretty',
                  'debug this mess',
                ].map((example) => (
                  <Chip
                    key={example}
                    label={`"${example}"`}
                    variant="outlined"
                    clickable
                    onClick={() => handleSuggestionClick(example)}
                  />
                ))}
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MessageBubble
                message={message}
                onRetry={message.role === 'assistant' ? handleRetry : undefined}
                sassLevel={sassLevel}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {(loading || isTyping) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingIndicator sassLevel={sassLevel} />
          </motion.div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Quick suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    variant="outlined"
                    size="small"
                    clickable
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </Box>
            </Box>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Progress bar for loading */}
        {loading && (
          <LinearProgress
            sx={{ mb: 2, borderRadius: 1 }}
            color="primary"
          />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Voice Input Button */}
          {voiceSupported && (
            <VoiceInput
              isListening={isListening}
              onToggle={handleVoiceToggle}
              transcript={transcript}
            />
          )}

          {/* Text Input */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={loading}
            placeholder="Tell me what you want... vaguely is fine 😏"
            multiline
            maxRows={4}
          />
        </Box>

        {/* Voice Transcript Display */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box
              sx={{
                mt: 2,
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="body2" color="primary">
                🎤 {transcript}
              </Typography>
            </Box>
          </motion.div>
        )}
      </Paper>
    </Box>
  );
};

export default ChatInterface;