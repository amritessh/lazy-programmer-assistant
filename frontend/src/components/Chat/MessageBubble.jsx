import React, { useState } from 'react';
import { Avatar, IconButton, Tooltip, Collapse } from '@mui/material';
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
  Lightbulb as LightbulbIcon
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
    <div key={index} className='my-4'>
      <div className='flex items-center justify-between bg-black/30 px-4 py-2 rounded-t-lg border-b border-white/10'>
        <div className='flex items-center gap-2'>
          <CodeIcon className='text-sm text-dark-400' />
          <span className='text-xs text-dark-400 uppercase tracking-wide'>
            {block.language}
          </span>
        </div>
        <Tooltip title='Copy code'>
          <button
            onClick={() => handleCopyCode(block.code)}
            className={`p-1 rounded transition-colors ${
              copied ? 'text-green-400' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <CopyIcon className='text-sm' />
          </button>
        </Tooltip>
      </div>
      <SyntaxHighlighter
        language={block.language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
          fontSize: '0.9rem'
        }}
      >
        {block.code}
      </SyntaxHighlighter>
    </div>
  );

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          language={match[1]}
          style={vscDarkPlus}
          customStyle={{ borderRadius: 6, fontSize: '0.9rem' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          className='bg-white/10 px-1 py-0.5 rounded text-sm font-mono'
          {...props}
        >
          {children}
        </code>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } items-start mb-6 gap-3`}
    >
      {/* Avatar */}
      <Avatar
        className={`w-10 h-10 flex-shrink-0 ${
          isUser ? 'bg-primary-500' : 'bg-secondary-500'
        }`}
      >
        {isUser ? <PersonIcon /> : <PsychologyIcon />}
      </Avatar>

      {/* Message Content */}
      <div className={`max-w-[70%] min-w-[200px] ${isUser ? 'mr-2' : 'ml-2'}`}>
        <div
          className={`p-4 rounded-2xl ${
            isUser
              ? 'bg-primary-500 text-white'
              : 'glass border border-white/10 text-dark-100'
          }`}
        >
          {/* Message Header */}
          <div
            className={`flex items-center justify-between ${
              hasCode || message.metadata ? 'mb-3' : 'mb-1'
            }`}
          >
            <div className='flex items-center gap-2'>
              <span
                className={`text-xs ${
                  isUser ? 'text-primary-100' : 'text-dark-400'
                }`}
              >
                {isUser ? 'You' : 'Assistant'}
              </span>
              {message.metadata?.timestamp && (
                <>
                  <span
                    className={`text-xs ${
                      isUser ? 'text-primary-200' : 'text-dark-500'
                    }`}
                  >
                    •
                  </span>
                  <span
                    className={`text-xs ${
                      isUser ? 'text-primary-200' : 'text-dark-400'
                    }`}
                  >
                    {new Date(message.metadata.timestamp).toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>

            <div className='flex items-center gap-1'>
              {/* Confidence indicator for assistant messages */}
              {isAssistant && message.metadata?.confidence && (
                <span className='px-2 py-1 text-xs bg-white/10 rounded-full border border-white/20'>
                  {Math.round(message.metadata.confidence * 100)}%
                </span>
              )}

              {/* Copy button */}
              <Tooltip title='Copy message'>
                <button
                  onClick={handleCopyMessage}
                  className={`p-1 rounded transition-colors ${
                    isUser
                      ? 'hover:bg-primary-400 text-primary-100'
                      : 'hover:bg-white/10 text-dark-400'
                  }`}
                >
                  <CopyIcon className='text-sm' />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Message Text */}
          <div className='prose prose-invert max-w-none'>
            <ReactMarkdown
              components={markdownComponents}
              children={message.content}
            />
          </div>

          {/* Assumptions */}
          {message.metadata?.assumptions &&
            message.metadata.assumptions.length > 0 && (
              <div className='mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <LightbulbIcon className='text-blue-400 text-sm' />
                  <span className='text-sm font-medium text-blue-300'>
                    Assumptions I made:
                  </span>
                </div>
                <ul className='text-sm text-blue-200 space-y-1 ml-4'>
                  {message.metadata.assumptions.map((assumption, index) => (
                    <li key={index} className='list-disc'>
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Code Generated Badge */}
          {message.metadata?.codeGenerated && (
            <div className='mt-3'>
              <span className='inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-300 border border-green-500/30 rounded-full'>
                <CodeIcon className='text-xs' />
                Code Generated
              </span>
            </div>
          )}
        </div>

        {/* Message Actions */}
        {isAssistant && (
          <div className='flex items-center justify-between mt-2 px-2'>
            <div className='flex items-center gap-1'>
              {/* Feedback buttons */}
              <Tooltip title='Helpful'>
                <button className='p-1 rounded-full hover:bg-green-500/20 text-dark-400 hover:text-green-400 transition-colors'>
                  <ThumbUpIcon className='text-sm' />
                </button>
              </Tooltip>
              <Tooltip title='Not helpful'>
                <button className='p-1 rounded-full hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition-colors'>
                  <ThumbDownIcon className='text-sm' />
                </button>
              </Tooltip>

              {/* Retry button */}
              {onRetry && (
                <Tooltip title='Regenerate response'>
                  <button
                    onClick={onRetry}
                    className='p-1 rounded-full hover:bg-primary-500/20 text-dark-400 hover:text-primary-400 transition-colors'
                  >
                    <RefreshIcon className='text-sm' />
                  </button>
                </Tooltip>
              )}
            </div>

            {/* Show details toggle */}
            {message.metadata && Object.keys(message.metadata).length > 2 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className='flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-dark-200 transition-colors'
              >
                Details
                {showDetails ? (
                  <ExpandLessIcon className='text-sm' />
                ) : (
                  <ExpandMoreIcon className='text-sm' />
                )}
              </button>
            )}
          </div>
        )}

        {/* Detailed metadata */}
        <Collapse in={showDetails}>
          <div className='mt-2 p-4 glass border border-white/10 rounded-lg'>
            <h4 className='text-sm font-medium text-dark-200 mb-3'>
              Message Details
            </h4>
            <div className='border-t border-white/10 pt-3'>
              {message.metadata?.context && (
                <div className='mb-4'>
                  <span className='text-xs text-dark-400 block mb-1'>
                    Project Context:
                  </span>
                  <span className='text-sm text-dark-200'>
                    {message.metadata.context.projectId || 'No project context'}
                  </span>
                </div>
              )}

              {message.metadata?.error && (
                <div className='mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded'>
                  <span className='text-sm text-yellow-300'>
                    Processing Error: {message.metadata.error}
                  </span>
                </div>
              )}

              <span className='text-xs text-dark-500'>
                Message ID: {message.id}
              </span>
            </div>
          </div>
        </Collapse>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
