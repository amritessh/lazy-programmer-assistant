
const { body, validationResult } = require('express-validator');
const vagueParse = require('../services/vagueParse');
const codeGenerator = require('../services/codeGenerator');
const personalityEngine = require('../services/personalityEngine');
const openaiClient = require('../services/openaiClient');

const generateController = {
  /**
   * Main message processing endpoint - handles vague requests and generates responses
   */
  async processMessage(req, res) {
    try {
      const { message, context, sessionId, userId } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      // Get user preferences (would normally come from database)
      const userPreferences = {
        aiPersonality: {
          sassLevel: 5,
          verbosity: 'detailed',
          explanationStyle: 'casual'
        }
      };

      // Step 1: Parse the vague request
      const parseResult = await vagueParse.parseVagueRequest(message, context, userPreferences);

      let response = '';
      let codeGenerated = false;
      let generatedCode = null;
      let assumptions = parseResult.assumptions;

      // Step 2: Determine if this needs code generation
      const needsCodeGeneration = this.shouldGenerateCode(parseResult);

      if (needsCodeGeneration && parseResult.confidence >= 0.4) {
        // Step 3: Generate code
        try {
          const codeResult = await codeGenerator.generateCode(
            {
              originalText: message,
              interpretation: parseResult.interpretation,
              specificAction: parseResult.specificAction,
              assumptions: parseResult.assumptions,
              confidence: parseResult.confidence
            },
            context,
            userPreferences
          );

          generatedCode = codeResult;
          codeGenerated = true;
          
          // Build response with code
          response = this.buildCodeResponse(codeResult, userPreferences.aiPersonality.sassLevel);
          
        } catch (codeError) {
          console.error('Code generation failed:', codeError);
          response = personalityEngine.generateErrorResponse(
            'I had trouble generating code for that request',
            userPreferences.aiPersonality.sassLevel
          );
        }
      } else if (parseResult.needsMoreInfo) {
        // Step 3a: Ask for clarification
        response = this.buildClarificationResponse(parseResult, userPreferences.aiPersonality.sassLevel);
      } else {
        // Step 3b: Provide interpretation without code
        response = this.buildInterpretationResponse(parseResult, userPreferences.aiPersonality.sassLevel);
      }

      // Add context-aware personality
      if (context) {
        const contextResponse = personalityEngine.generateContextAwareResponse(
          context, 
          userPreferences.aiPersonality.sassLevel
        );
        if (contextResponse) {
          response = contextResponse + '\n\n' + response;
        }
      }

      res.json({
        success: true,
        data: {
          response,
          codeGenerated,
          generatedCode,
          assumptions,
          confidence: parseResult.confidence,
          interpretation: parseResult.interpretation,
          needsMoreInfo: parseResult.needsMoreInfo,
          clarifyingQuestions: parseResult.clarifyingQuestions,
          alternativeInterpretations: parseResult.alternativeInterpretations
        },
        message: 'Message processed successfully'
      });

    } catch (error) {
      console.error('Error processing message:', error);
      
      const sassLevel = req.body.userPreferences?.aiPersonality?.sassLevel || 5;
      const errorResponse = personalityEngine.generateErrorResponse(error.message, sassLevel);
      
      res.status(500).json({
        success: false,
        error: 'Failed to process message',
        response: errorResponse
      });
    }
  },

  /**
   * Generate code endpoint
   */
  async generateCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { description, context, userPreferences, interpretation } = req.body;

      // Use provided interpretation or create one
      let parseResult = interpretation;
      if (!parseResult) {
        parseResult = await vagueParse.parseVagueRequest(description, context, userPreferences);
      }

      // Generate code
      const codeResult = await codeGenerator.generateCode(parseResult, context, userPreferences);

      res.json({
        success: true,
        data: codeResult,
        message: 'Code generated successfully'
      });

    } catch (error) {
      console.error('Error generating code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate code'
      });
    }
  },

  /**
   * Explain code endpoint
   */
  async explainCode(req, res) {
    try {
      const { code, context, userPreferences } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required for explanation'
        });
      }

      const explainLevel = userPreferences?.explanationStyle || 'detailed';
      const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;

      const response = await openaiClient.createExplanationCompletion(code, {
        language: context?.primaryLanguage || 'javascript',
        explainLevel
      });

      const explanation = response.choices[0].message.content;
      
      // Add personality to explanation
      const personalizedExplanation = personalityEngine.addPersonality(
        explanation,
        'explain this code',
        userPreferences?.aiPersonality
      );

      res.json({
        success: true,
        data: {
          explanation: personalizedExplanation,
          code,
          language: context?.primaryLanguage || 'javascript'
        },
        message: 'Code explained successfully'
      });

    } catch (error) {
      console.error('Error explaining code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to explain code'
      });
    }
  },

  /**
   * Improve code endpoint
   */
  async improveCode(req, res) {
    try {
      const { code, improvementType, context, userPreferences } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required for improvement'
        });
      }

      const improvement = await codeGenerator.improveCode(
        code, 
        improvementType || 'general', 
        context
      );

      // Add personality to response
      const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;
      const personalizedResponse = personalityEngine.addPersonality(
        improvement.explanation,
        `improve this ${improvementType || 'code'}`,
        userPreferences?.aiPersonality
      );

      res.json({
        success: true,
        data: {
          originalCode: code,
          improvedCode: improvement.code,
          explanation: personalizedResponse,
          improvementType: improvementType || 'general'
        },
        message: 'Code improved successfully'
      });

    } catch (error) {
      console.error('Error improving code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to improve code'
      });
    }
  },

  /**
   * Debug code endpoint
   */
  async debugCode(req, res) {
    try {
      const { code, error: errorMessage, context, userPreferences } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required for debugging'
        });
      }

      const response = await openaiClient.createDebuggingCompletion(
        code, 
        errorMessage || 'Code is not working as expected', 
        {
          language: context?.primaryLanguage || 'javascript',
          framework: context?.framework
        }
      );

      const debugResult = response.choices[0].message.content;
      
      // Add personality
      const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;
      const personalizedResult = personalityEngine.addPersonality(
        debugResult,
        'debug this broken code',
        userPreferences?.aiPersonality
      );

      res.json({
        success: true,
        data: {
          originalCode: code,
          debugResult: personalizedResult,
          error: errorMessage
        },
        message: 'Code debugging completed'
      });

    } catch (error) {
      console.error('Error debugging code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to debug code'
      });
    }
  },

  /**
   * Helper: Should we generate code for this request?
   */
  shouldGenerateCode(parseResult) {
    const codeActions = [
      'debug_and_fix',
      'create_ui_component',
      'implement_frontend_feature',
      'implement_backend_feature',
      'general_implementation',
      'improve_code'
    ];

    return codeActions.includes(parseResult.specificAction) || 
           parseResult.interpretation.toLowerCase().includes('code') ||
           parseResult.interpretation.toLowerCase().includes('implement') ||
           parseResult.interpretation.toLowerCase().includes('create') ||
           parseResult.interpretation.toLowerCase().includes('fix');
  },

  /**
   * Helper: Build code response
   */
  buildCodeResponse(codeResult, sassLevel) {
    let response = '';
    
    // Sassy intro
    response += personalityEngine.generateCodeIntro(sassLevel, 'code');
    response += '\n\n';
    
    // Code block
    response += '```' + (codeResult.language || 'javascript') + '\n';
    response += codeResult.code;
    response += '\n```\n\n';
    
    // Explanation
    response += codeResult.explanation;
    
    // Assumptions
    if (codeResult.assumptions && codeResult.assumptions.length > 0) {
      response += '\n\n' + personalityEngine.generateAssumptionText(codeResult.assumptions, sassLevel);
    }
    
    // Usage example
    if (codeResult.usage) {
      response += '\n\n**Usage:**\n```' + (codeResult.language || 'javascript') + '\n';
      response += codeResult.usage;
      response += '\n```';
    }
    
    return response;
  },

  /**
   * Helper: Build clarification response
   */
  buildClarificationResponse(parseResult, sassLevel) {
    let response = personalityEngine.generateClarifyingQuestions(
      parseResult.clarifyingQuestions,
      sassLevel
    );
    
    if (parseResult.alternativeInterpretations && parseResult.alternativeInterpretations.length > 0) {
      response += '\n\nOr maybe you meant one of these:\n';
      parseResult.alternativeInterpretations.forEach((alt, index) => {
        response += `${index + 1}. ${alt.description}\n`;
      });
    }
    
    return response;
  },

  /**
   * Helper: Build interpretation response
   */
  buildInterpretationResponse(parseResult, sassLevel) {
    let response = `I think you want to: ${parseResult.interpretation}`;
    
    if (parseResult.suggestedActions && parseResult.suggestedActions.length > 0) {
      response += '\n\nHere\'s what I suggest:\n';
      parseResult.suggestedActions.forEach((action, index) => {
        response += `${index + 1}. ${action}\n`;
      });
    }
    
    if (parseResult.assumptions && parseResult.assumptions.length > 0) {
      response += '\n\n' + personalityEngine.generateAssumptionText(parseResult.assumptions, sassLevel);
    }
    
    return response;
  }
};

// Validation middleware
generateController.validateGenerateRequest = [
  body('description')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
    
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
    
  body('userPreferences')
    .optional()
    .isObject()
    .withMessage('User preferences must be an object')
];

module.exports = generateController;