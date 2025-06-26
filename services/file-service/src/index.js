import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.FILE_SERVICE_PORT || 3005;

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    userId: req.headers['x-user-id'],
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'file-service'
  });
});

// File routes
app.post('/upload', (req, res) => {
  try {
    const { fileName, content, userId } = req.body;

    // Mock file upload response
    res.json({
      success: true,
      data: {
        fileId: Date.now().toString(),
        fileName,
        size: content ? content.length : 0,
        uploadedAt: new Date().toISOString()
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

app.get('/files/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Mock file list response
    res.json({
      success: true,
      data: {
        files: [
          {
            id: '1',
            name: 'example.js',
            size: 1024,
            type: 'javascript',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'README.md',
            size: 512,
            type: 'markdown',
            createdAt: new Date().toISOString()
          }
        ]
      },
      message: 'Files retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve files'
    });
  }
});

app.get('/file/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;

    // Mock file content response
    res.json({
      success: true,
      data: {
        id: fileId,
        name: 'example.js',
        content: 'console.log("Hello, World!");',
        type: 'javascript',
        size: 28,
        createdAt: new Date().toISOString()
      },
      message: 'File content retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving file content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file content'
    });
  }
});

app.delete('/file/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;

    // Mock file deletion response
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`File Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
