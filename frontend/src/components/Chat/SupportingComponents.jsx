// frontend/src/components/Chat/SupportingComponents.jsx
import React from 'react';
import { Tooltip } from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Voice Input Component
export const VoiceInput = ({ isListening, onToggle, transcript }) => {
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
        <button
          onClick={onToggle}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-medium
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800
            ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 shadow-glow-error focus:ring-red-500'
                : 'bg-primary-500 hover:bg-primary-600 shadow-glow-primary focus:ring-primary-500'
            }
          `}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </button>
      </motion.div>
    </Tooltip>
  );
};

// Loading Indicator Component
export const LoadingIndicator = ({ sassLevel = 5 }) => {
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
    <div className='flex items-center gap-4 p-4'>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <PsychologyIcon className='text-primary-500' />
      </motion.div>
      <p className='text-dark-400 italic text-sm'>{getMessage()}</p>
    </div>
  );
};

// Sass Level Slider Component
export const SassLevelSlider = ({ value, onChange, className = '' }) => {
  const sassLevels = {
    1: {
      name: 'Polite',
      color: 'success',
      description: 'Professional and helpful',
      bgColor: 'bg-green-500'
    },
    2: {
      name: 'Friendly',
      color: 'info',
      description: 'Casual and nice',
      bgColor: 'bg-blue-500'
    },
    3: {
      name: 'Playful',
      color: 'info',
      description: 'Mildly sarcastic',
      bgColor: 'bg-blue-500'
    },
    4: {
      name: 'Witty',
      color: 'warning',
      description: 'Sarcastic but helpful',
      bgColor: 'bg-yellow-500'
    },
    5: {
      name: 'Sassy',
      color: 'warning',
      description: 'Moderately sassy',
      bgColor: 'bg-orange-500'
    },
    6: {
      name: 'Snarky',
      color: 'warning',
      description: 'Quite sassy',
      bgColor: 'bg-orange-600'
    },
    7: {
      name: 'Sarcastic',
      color: 'error',
      description: 'Very sassy',
      bgColor: 'bg-red-500'
    },
    8: {
      name: 'Brutal',
      color: 'error',
      description: 'Brutally honest',
      bgColor: 'bg-red-600'
    },
    9: {
      name: 'Savage',
      color: 'error',
      description: 'Savage responses',
      bgColor: 'bg-red-700'
    },
    10: {
      name: 'Maximum',
      color: 'error',
      description: 'Maximum sass mode',
      bgColor: 'bg-red-800'
    }
  };

  const currentLevel = sassLevels[value];

  return (
    <div className={className}>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-medium text-dark-200'>AI Sass Level</h3>
        <div className='flex items-center gap-2'>
          <span
            className={`w-3 h-3 rounded-full ${currentLevel.bgColor}`}
          ></span>
          <span className='text-sm text-dark-300'>
            {value}: {currentLevel.name}
          </span>
        </div>
      </div>

      {/* Custom slider using HTML input */}
      <div className='relative mb-3'>
        <input
          type='range'
          min='1'
          max='10'
          step='1'
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className='w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider'
          style={{
            background: `linear-gradient(to right, 
              ${
                value <= 3 ? '#10b981' : value <= 6 ? '#f59e0b' : '#ef4444'
              } 0%, 
              #ef4444 100%)`
          }}
        />

        {/* Slider markers */}
        <div className='flex justify-between mt-2 px-1'>
          <span className='text-xs text-dark-400'>😊</span>
          <span className='text-xs text-dark-400'>😏</span>
          <span className='text-xs text-dark-400'>😤</span>
        </div>
      </div>

      <p className='text-xs text-dark-400 mt-2'>{currentLevel.description}</p>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
};
