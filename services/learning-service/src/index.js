import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import winston from 'winston';

const app = express();
const PORT = process.env.LEARNING_SERVICE_PORT || 3004;

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
    service: 'learning-service'
  });
});

// Learning routes
app.post('/learn', (req, res) => {
  try {
    const { content, context, userId } = req.body;

    // Mock learning response
    res.json({
      success: true,
      data: {
        learned: true,
        insights: ['This appears to be a learning request'],
        recommendations: ['Consider breaking this down into smaller chunks']
      },
      message: 'Learning processed successfully'
    });
  } catch (error) {
    logger.error('Error processing learning:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process learning'
    });
  }
});

app.get('/insights/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Mock insights response
    res.json({
      success: true,
      data: {
        insights: [
          'You tend to work on JavaScript projects',
          'Your code quality has improved over time',
          'You frequently use React patterns'
        ],
        recommendations: [
          'Consider learning TypeScript',
          'Try implementing more unit tests',
          'Explore advanced React patterns'
        ]
      },
      message: 'Insights retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve insights'
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
  logger.info(`Learning Service running on port ${PORT}`);
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
