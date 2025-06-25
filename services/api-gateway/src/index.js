import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';

// Import routes
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import projectRoutes from './routes/projects.js';

// Import middleware
import authMiddleware from './middleware/auth.js';
import validationMiddleware from './middleware/validation.js';

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3001;

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Frontend dev
      'http://localhost:5173', // Vite dev server
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);

// Service proxies (protected)
const serviceProxyConfig = {
  '/api/context': {
    target: `http://localhost:${process.env.CONTEXT_SERVICE_PORT || 3002}`,
    pathRewrite: { '^/api/context': '' }
  },
  '/api/ai': {
    target: `http://localhost:${process.env.AI_SERVICE_PORT || 3003}`,
    pathRewrite: { '^/api/ai': '' }
  },
  '/api/learning': {
    target: `http://localhost:${process.env.LEARNING_SERVICE_PORT || 3004}`,
    pathRewrite: { '^/api/learning': '' }
  },
  '/api/files': {
    target: `http://localhost:${process.env.FILE_SERVICE_PORT || 3005}`,
    pathRewrite: { '^/api/files': '' }
  }
};

// Create proxies for each service
Object.entries(serviceProxyConfig).forEach(([path, config]) => {
  app.use(
    path,
    authMiddleware,
    createProxyMiddleware({
      ...config,
      changeOrigin: true,
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${path}:`, err);
        res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add user context to proxied requests
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Email', req.user.email || '');
        }
      }
    })
  );
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service endpoints configured:', Object.keys(serviceProxyConfig));
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
