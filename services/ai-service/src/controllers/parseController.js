
const { body, validationResult } = require('express-validator');
const vagueParse = require('../services/vagueParse');
const personalityEngine = require('../services/personalityEngine');

const parseController = {
  /**
   * Parse vague request into structured interpretation
   */
  async parseVagueRequest(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { text, context, userPreferences } = req.body;
      const userId = req.headers['x-user-id'];

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Text is required for parsing'
        });
      }

      // Parse the vague request
      const parseResult = await vagueParse.parseVagueRequest(text, context, userPreferences);

      // Add personality to clarifying questions if needed
      if (parseResult.needsMoreInfo && parseResult.clarifyingQuestions.length > 0) {
        const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;
        parseResult.personalizedQuestions = personalityEngine.generateClarifyingQuestions(
          parseResult.clarifyingQuestions,
          sassLevel
        );
      }

      // Log parsing result for learning
      if (userId) {
        // TODO: Send to learning service
        console.log(`Parse result for user ${userId}:`, {
          originalText: text,
          interpretation: parseResult.interpretation,
          confidence: parseResult.confidence
        });
      }

      res.json({
        success: true,
        data: parseResult,
        message: 'Request parsed successfully'
      });

    } catch (error) {
      console.error('Error parsing vague request:', error);
      
      const sassLevel = req.body.userPreferences?.aiPersonality?.sassLevel || 5;
      const errorResponse = personalityEngine.generateErrorResponse(error.message, sassLevel);
      
      res.status(500).json({
        success: false,
        error: 'Failed to parse request',
        message: errorResponse
      });
    }
  }
};

// Validation middleware
parseController.validateParseRequest = [
  body('text')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Text must be between 1 and 1000 characters'),
  
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
    
  body('userPreferences')
    .optional()
    .isObject()
    .withMessage('User preferences must be an object'),
    
  body('userPreferences.aiPersonality.sassLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Sass level must be between 1 and 10')
];

export default parseController;