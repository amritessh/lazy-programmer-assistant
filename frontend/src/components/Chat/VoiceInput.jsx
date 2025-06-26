// frontend/src/components/Chat/VoiceInput.jsx
import React from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import { Mic as MicIcon, MicOff as MicOffIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const VoiceInput = ({ isListening, onToggle, transcript }) => {
  return (
    <Tooltip title={isListening ? 'Stop listening' : 'Start voice input'}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: isListening ? [1, 1.1, 1] : 1
        }}
        transition={{
          repeat: isListening ? Infinity : 0,
          duration: 1.5
        }}
      >
        <IconButton
          onClick={onToggle}
          color={isListening ? 'error' : 'primary'}
          sx={{
            bgcolor: isListening ? 'error.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: isListening ? 'error.dark' : 'primary.dark'
            },
            boxShadow: isListening ? '0 0 20px rgba(244, 67, 54, 0.5)' : 'none'
          }}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
      </motion.div>
    </Tooltip>
  );
};

// frontend/src/components/Chat/LoadingIndicator.jsx
const LoadingIndicator = ({ sassLevel = 5 }) => {
  const loadingMessages = {
    1: 'Processing your request...',
    3: 'Working on it...',
    5: 'Decoding your vague mumbling...',
    7: 'Trying to make sense of that...',
    10: 'Consulting my crystal ball...'
  };

  const getMessage = () => {
    const levels = Object.keys(loadingMessages).map(Number);
    const closestLevel = levels.reduce((prev, curr) =>
      Math.abs(curr - sassLevel) < Math.abs(prev - sassLevel) ? curr : prev
    );
    return loadingMessages[closestLevel];
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <PsychologyIcon color='primary' />
      </motion.div>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontStyle: 'italic' }}
      >
        {getMessage()}
      </Typography>
    </Box>
  );
};

// frontend/src/components/Chat/SassLevelSlider.jsx
import { Slider, Box, Typography, Chip } from '@mui/material';

const SassLevelSlider = ({ value, onChange, sx }) => {
  const sassLevels = {
    1: {
      name: 'Polite',
      color: 'success',
      description: 'Professional and helpful'
    },
    2: { name: 'Friendly', color: 'info', description: 'Casual and nice' },
    3: { name: 'Playful', color: 'info', description: 'Mildly sarcastic' },
    4: {
      name: 'Witty',
      color: 'warning',
      description: 'Sarcastic but helpful'
    },
    5: { name: 'Sassy', color: 'warning', description: 'Moderately sassy' },
    6: { name: 'Snarky', color: 'warning', description: 'Quite sassy' },
    7: { name: 'Sarcastic', color: 'error', description: 'Very sassy' },
    8: { name: 'Brutal', color: 'error', description: 'Brutally honest' },
    9: { name: 'Savage', color: 'error', description: 'Savage responses' },
    10: { name: 'Maximum', color: 'error', description: 'Maximum sass mode' }
  };

  const currentLevel = sassLevels[value];

  return (
    <Box sx={sx}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1
        }}
      >
        <Typography variant='body2' fontWeight='medium'>
          AI Sass Level
        </Typography>
        <Chip
          label={`${value}: ${currentLevel.name}`}
          size='small'
          color={currentLevel.color}
          variant='outlined'
        />
      </Box>

      <Slider
        value={value}
        onChange={(e, newValue) => onChange(newValue)}
        min={1}
        max={10}
        step={1}
        marks={[
          { value: 1, label: '😊' },
          { value: 5, label: '😏' },
          { value: 10, label: '😤' }
        ]}
        sx={{
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20
          },
          '& .MuiSlider-track': {
            background: `linear-gradient(90deg, 
              ${
                currentLevel.color === 'success'
                  ? '#4caf50'
                  : currentLevel.color === 'info'
                  ? '#2196f3'
                  : currentLevel.color === 'warning'
                  ? '#ff9800'
                  : '#f44336'
              } 0%, 
              #f44336 100%)`
          }
        }}
      />

      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mt: 0.5, display: 'block' }}
      >
        {currentLevel.description}
      </Typography>
    </Box>
  );
};

// Export all components
export { VoiceInput, LoadingIndicator, SassLevelSlider };
