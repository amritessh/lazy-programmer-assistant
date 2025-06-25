// frontend/src/components/Chat/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { TextField, IconButton, Box, Tooltip, Chip, Fade } from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ChatInput = ({
  onSend,
  disabled,
  placeholder = 'Type your message...',
  multiline = true,
  maxRows = 4
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Auto-resize and focus management
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  // Quick action suggestions
  const quickSuggestions = [
    'fix the error',
    'make it work',
    'add a button',
    'explain this code',
    'improve this'
  ];

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Quick suggestions when input is empty and focused */}
      <Fade in={isFocused && message.length === 0}>
        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {quickSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Chip
                label={suggestion}
                size='small'
                variant='outlined'
                clickable
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  fontSize: '0.7rem',
                  height: 24,
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText'
                  }
                }}
              />
            </motion.div>
          ))}
        </Box>
      </Fade>

      {/* Main input area */}
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          position: 'relative'
        }}
      >
        {/* Text input */}
        <TextField
          ref={inputRef}
          fullWidth
          multiline={multiline}
          maxRows={maxRows}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          variant='outlined'
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'background.paper',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              '&.Mui-focused': {
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2
                }
              }
            },
            '& .MuiInputBase-input': {
              padding: '12px 16px',
              fontSize: '1rem',
              lineHeight: 1.5
            }
          }}
          InputProps={{
            endAdornment: (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}
              >
                {/* Character count for long messages */}
                {message.length > 100 && (
                  <Chip
                    label={`${message.length}/2000`}
                    size='small'
                    variant='outlined'
                    sx={{
                      fontSize: '0.7rem',
                      height: 20,
                      color:
                        message.length > 1800
                          ? 'warning.main'
                          : 'text.secondary'
                    }}
                  />
                )}

                {/* File attachment button */}
                <Tooltip title='Attach files (coming soon)'>
                  <IconButton
                    size='small'
                    disabled
                    sx={{ color: 'text.secondary' }}
                  >
                    <AttachFileIcon fontSize='small' />
                  </IconButton>
                </Tooltip>

                {/* Emoji button */}
                <Tooltip title='Add emoji (coming soon)'>
                  <IconButton
                    size='small'
                    disabled
                    sx={{ color: 'text.secondary' }}
                  >
                    <EmojiIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }}
        />

        {/* Send button */}
        <Tooltip
          title={message.trim() ? 'Send message (Enter)' : 'Type a message'}
        >
          <span>
            <IconButton
              type='submit'
              disabled={!message.trim() || disabled}
              color='primary'
              sx={{
                bgcolor:
                  message.trim() && !disabled
                    ? 'primary.main'
                    : 'action.disabled',
                color:
                  message.trim() && !disabled
                    ? 'primary.contrastText'
                    : 'text.disabled',
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor:
                    message.trim() && !disabled
                      ? 'primary.dark'
                      : 'action.disabled'
                },
                '&:disabled': {
                  bgcolor: 'action.disabled'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Input hints */}
      <Fade in={isFocused}>
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label='Enter to send'
              size='small'
              variant='outlined'
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
            <Chip
              label='Shift+Enter for new line'
              size='small'
              variant='outlined'
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>

          {message.length > 1800 && (
            <Chip
              label='Message getting long!'
              size='small'
              color='warning'
              variant='outlined'
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default ChatInput;
