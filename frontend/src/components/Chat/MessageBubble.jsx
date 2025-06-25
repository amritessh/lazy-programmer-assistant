// frontend/src/components/Chat/MessageBubble.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Button,
  Divider,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Code as CodeIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const MessageBubble = ({ message, onRetry, sassLevel = 5 }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Extract code blocks from message content
  const extractCodeBlocks = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const blocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'javascript',
        code: match[2],
        fullMatch: match[0]
      });
    }

    return blocks;
  };

  const codeBlocks = extractCodeBlocks(message.content);
  const hasCode = codeBlocks.length > 0;

  // Copy code to clipboard
  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Copy entire message
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Message copied!');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  // Render code block with syntax highlighting
  const renderCodeBlock = (block, index) => (
    <Box key={index} sx={{ my: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          px: 2,
          py: 1,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon fontSize='small' />
          <Typography variant='caption' color='text.secondary'>
            {block.language}
          </Typography>
        </Box>
        <Tooltip title='Copy code'>
          <IconButton
            size='small'
            onClick={() => handleCopyCode(block.code)}
            sx={{ color: copied ? 'success.main' : 'text.secondary' }}
          >
            <CopyIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter
        language={block.language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          fontSize: '0.9rem'
        }}
      >
        {block.code}
      </SyntaxHighlighter>
    </Box>
  );

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          language={match[1]}
          style={vscDarkPlus}
          customStyle={{ borderRadius: 4, fontSize: '0.9rem' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <Box
          component='code'
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.9em',
            fontFamily: 'monospace'
          }}
          {...props}
        >
          {children}
        </Box>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          mb: 3,
          gap: 2
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            width: 40,
            height: 40
          }}
        >
          {isUser ? <PersonIcon /> : <PsychologyIcon />}
        </Avatar>

        {/* Message Content */}
        <Box
          sx={{
            maxWidth: '70%',
            minWidth: '200px'
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: isUser ? 'primary.main' : 'background.paper',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              border: isAssistant
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : 'none'
            }}
          >
            {/* Message Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: hasCode || message.metadata ? 1 : 0
              }}
            >
              <Typography
                variant='caption'
                color='inherit'
                sx={{ opacity: 0.8 }}
              >
                {isUser ? 'You' : 'Assistant'}
                {message.metadata?.timestamp && (
                  <>
                    {' '}
                    •{' '}
                    {new Date(message.metadata.timestamp).toLocaleTimeString()}
                  </>
                )}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Confidence indicator for assistant messages */}
                {isAssistant && message.metadata?.confidence && (
                  <Chip
                    label={`${Math.round(message.metadata.confidence * 100)}%`}
                    size='small'
                    variant='outlined'
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}

                {/* Copy button */}
                <Tooltip title='Copy message'>
                  <IconButton
                    size='small'
                    onClick={handleCopyMessage}
                    sx={{ color: 'inherit', opacity: 0.7 }}
                  >
                    <CopyIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Message Text */}
            <ReactMarkdown
              components={markdownComponents}
              children={message.content}
            />

            {/* Assumptions */}
            {message.metadata?.assumptions &&
              message.metadata.assumptions.length > 0 && (
                <Alert
                  severity='info'
                  sx={{ mt: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}
                  icon={<LightbulbIcon />}
                >
                  <Typography variant='body2' fontWeight='medium' gutterBottom>
                    Assumptions I made:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {message.metadata.assumptions.map((assumption, index) => (
                      <li key={index}>
                        <Typography variant='body2'>{assumption}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

            {/* Code Generated Badge */}
            {message.metadata?.codeGenerated && (
              <Chip
                icon={<CodeIcon />}
                label='Code Generated'
                size='small'
                color='success'
                variant='outlined'
                sx={{ mt: 1 }}
              />
            )}
          </Paper>

          {/* Message Actions */}
          {isAssistant && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 1,
                px: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Feedback buttons */}
                <Tooltip title='Helpful'>
                  <IconButton size='small' color='success'>
                    <ThumbUpIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Not helpful'>
                  <IconButton size='small' color='error'>
                    <ThumbDownIcon fontSize='small' />
                  </IconButton>
                </Tooltip>

                {/* Retry button */}
                {onRetry && (
                  <Tooltip title='Regenerate response'>
                    <IconButton size='small' onClick={onRetry}>
                      <RefreshIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Show details toggle */}
              {message.metadata && Object.keys(message.metadata).length > 2 && (
                <Button
                  size='small'
                  onClick={() => setShowDetails(!showDetails)}
                  endIcon={
                    showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  }
                  sx={{ textTransform: 'none' }}
                >
                  Details
                </Button>
              )}
            </Box>
          )}

          {/* Detailed metadata */}
          <Collapse in={showDetails}>
            <Paper
              sx={{
                mt: 1,
                p: 2,
                backgroundColor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant='body2' fontWeight='medium' gutterBottom>
                Message Details
              </Typography>
              <Divider sx={{ mb: 1 }} />

              {message.metadata?.context && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Project Context:
                  </Typography>
                  <Typography variant='body2'>
                    {message.metadata.context.projectId || 'No project context'}
                  </Typography>
                </Box>
              )}

              {message.metadata?.error && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  <Typography variant='body2'>
                    Processing Error: {message.metadata.error}
                  </Typography>
                </Alert>
              )}

              <Typography variant='caption' color='text.secondary'>
                Message ID: {message.id}
              </Typography>
            </Paper>
          </Collapse>
        </Box>
      </Box>
    </motion.div>
  );
};

export default MessageBubble;
