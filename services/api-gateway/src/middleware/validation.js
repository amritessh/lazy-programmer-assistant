import { body, validationResult } from 'express-validator';

const validationMiddleware = {
  /**
   * Validate chat message
   */
  validateChatMessage: [
    body('message')
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Message must be between 1 and 10000 characters'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string'),
    body('userId').optional().isString().withMessage('User ID must be a string')
  ],

  /**
   * Validate project creation
   */
  validateProjectCreation: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
  ],

  /**
   * Validate project update
   */
  validateProjectUpdate: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
  ],

  /**
   * Validate user registration
   */
  validateUserRegistration: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters')
  ],

  /**
   * Validate user login
   */
  validateUserLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  /**
   * Handle validation errors
   */
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  },

  /**
   * Sanitize input
   */
  sanitizeInput: (req, res, next) => {
    // Sanitize string inputs
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
        }
      });
    }

    next();
  },

  /**
   * Rate limiting helper
   */
  createRateLimiter: (windowMs, max, message) => {
    return {
      windowMs,
      max,
      message: {
        success: false,
        error: message || 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    };
  }
};

export default validationMiddleware;
