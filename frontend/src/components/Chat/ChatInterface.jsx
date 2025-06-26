// frontend/src/components/Chat/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Psychology as PsychologyIcon, Settings as SettingsIcon, Mic as MicIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { VoiceInput, LoadingIndicator, SassLevelSlider } from './index';

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
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 glass border-b border-white/10 bg-dark-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PsychologyIcon className="text-primary-500 text-2xl" />
            <div>
              <h1 className="text-lg font-semibold text-dark-100">
                Lazy Programmer's Assistant
              </h1>
              <p className="text-sm text-dark-400">
                {currentProject ? `Project: ${currentProject.name}` : 'No project selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sass Level Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary-500/20 border border-secondary-500/30 rounded-full">
              <span className="text-xs text-secondary-300">Sass Level:</span>
              <span className="text-xs font-medium text-secondary-200">{sassLevel}</span>
            </div>

            {/* Voice Support Indicator */}
            {voiceSupported && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <MicIcon className="text-sm text-green-300" />
                <span className="text-xs text-green-300">Voice Ready</span>
              </div>
            )}

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
              title="Settings"
            >
              <SettingsIcon className="text-lg" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <SassLevelSlider
                value={sassLevel}
                onChange={setSassLevel}
                className="max-w-md"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0"
          >
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center justify-between">
              <span className="text-red-300 text-sm">{error}</span>
              <button
                onClick={clearError}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <RefreshIcon className="text-red-300 text-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-auto bg-dark-900 p-4 scroll-smooth"
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8"
          >
            <div className="card-glass max-w-2xl mx-auto">
              <PsychologyIcon className="text-6xl text-primary-500 mb-4 mx-auto block drop-shadow-lg" />
              
              <h2 className="text-2xl font-bold text-dark-100 mb-2">
                Welcome to your Lazy Programming Assistant!
              </h2>
              <p className="text-dark-300 mb-6 leading-relaxed">
                I specialize in understanding vague requests and turning them into working code.
                Try saying things like:
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {[
                  'make the thing work',
                  'fix the broken stuff',
                  'add a button that does the thing',
                  'make it pretty',
                  'debug this mess',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => handleSuggestionClick(example)}
                    className="px-3 py-1 text-sm bg-dark-700 hover:bg-primary-500 text-dark-300 hover:text-white border border-dark-600 hover:border-primary-500 rounded-full transition-all duration-200"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
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
            className="mt-4"
          >
            <p className="text-sm text-dark-400 mb-2">
              Quick suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-sm bg-dark-700 hover:bg-primary-500 text-dark-300 hover:text-white border border-dark-600 hover:border-primary-500 rounded-full transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 glass border-t border-white/10 bg-dark-800/50">
        {/* Progress bar for loading */}
        {loading && (
          <div className="mb-3">
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
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
        </div>

        {/* Voice Transcript Display */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <MicIcon className="text-primary-400 text-sm" />
              <span className="text-primary-300 text-sm">
                {transcript}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;// frontend/src/components/Chat/ChatInterface.jsx
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