// frontend/src/components/Chat/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = maxRows * 24; // Approximate line height
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [message, maxRows]);

  // Auto-focus when not disabled
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
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
    textareaRef.current?.focus();
  };

  return (
    <div className='w-full'>
      {/* Quick suggestions when input is empty and focused */}
      {isFocused && message.length === 0 && (
        <div className='mb-3 flex flex-wrap gap-2'>
          {quickSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className='px-3 py-1 text-xs bg-dark-700 hover:bg-primary-500 text-dark-300 hover:text-white border border-dark-600 hover:border-primary-500 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800'
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      )}

      {/* Main input form */}
      <form onSubmit={handleSubmit} className='flex items-end gap-3 relative'>
        {/* Text input container */}
        <div className='flex-1 relative'>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-4 py-3 pr-24 bg-dark-800 border border-dark-600 rounded-2xl
              text-dark-100 placeholder-dark-400 resize-none
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              hover:border-dark-500 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isFocused ? 'bg-dark-700' : ''}
            `}
            style={{
              minHeight: '48px',
              maxHeight: `${maxRows * 24}px`
            }}
          />

          {/* Input actions */}
          <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
            {/* Character count for long messages */}
            {message.length > 100 && (
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  message.length > 1800
                    ? 'text-orange-400 border-orange-400/30 bg-orange-400/10'
                    : 'text-dark-400 border-dark-600 bg-dark-700'
                }`}
              >
                {message.length}/2000
              </span>
            )}

            {/* File attachment button */}
            <button
              type='button'
              disabled
              className='p-1 text-dark-500 hover:text-dark-400 transition-colors disabled:opacity-30'
              title='Attach files (coming soon)'
            >
              <AttachFileIcon className='text-sm' />
            </button>

            {/* Emoji button */}
            <button
              type='button'
              disabled
              className='p-1 text-dark-500 hover:text-dark-400 transition-colors disabled:opacity-30'
              title='Add emoji (coming soon)'
            >
              <EmojiIcon className='text-sm' />
            </button>
          </div>
        </div>

        {/* Send button */}
        <button
          type='submit'
          disabled={!message.trim() || disabled}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800
            ${
              message.trim() && !disabled
                ? 'bg-gradient-primary text-white shadow-lg hover:shadow-glow-primary focus:ring-primary-500'
                : 'bg-dark-700 text-dark-500 cursor-not-allowed'
            }
          `}
          title={message.trim() ? 'Send message (Enter)' : 'Type a message'}
        >
          <SendIcon />
        </button>
      </form>

      {/* Input hints */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-3 flex justify-between items-center'
        >
          <div className='flex gap-4'>
            <span className='text-xs px-2 py-1 bg-dark-700 text-dark-400 rounded border border-dark-600'>
              Enter to send
            </span>
            <span className='text-xs px-2 py-1 bg-dark-700 text-dark-400 rounded border border-dark-600'>
              Shift+Enter for new line
            </span>
          </div>

          {message.length > 1800 && (
            <span className='text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded border border-orange-500/30'>
              Message getting long!
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ChatInput;
