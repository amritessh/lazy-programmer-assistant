// services/ai-service/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import winston from 'winston';

// Import controllers
import generateController from './controllers/generateController.js';
import parseController from './controllers/parseController.js';

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3003;

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
app.use(express.json({ limit: '10mb' }));
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
    service: 'ai-service'
  });
});

// Routes
app.post('/parse', parseController.parseVagueRequest);
app.post('/generate', generateController.generateCode);
app.post('/process', generateController.processMessage); // Main chat processing endpoint
app.post('/explain', generateController.explainCode);
app.post('/improve', generateController.improveCode);
app.post('/debug', generateController.debugCode);

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
  logger.info(`AI Service running on port ${PORT}`);
  logger.info('OpenAI API configured:', !!process.env.OPENAI_API_KEY);
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
