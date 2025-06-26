import { body, validationResult } from 'express-validator';
import vagueParse from '../services/vagueParse.js';
import codeGenerator from '../services/codeGenerator.js';
import personalityEngine from '../services/personalityEngine.js';
import openaiClient from '../services/openaiClient.js';

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
      const { code, context, userPreferences, improvementType } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required for improvement'
        });
      }

      const improvementTypes = ['performance', 'readability', 'security', 'best-practices'];
      const type = improvementTypes.includes(improvementType) ? improvementType : 'best-practices';
      const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;

      const response = await openaiClient.createImprovementCompletion(code, {
        language: context?.primaryLanguage || 'javascript',
        improvementType: type
      });

      const improvedCode = response.choices[0].message.content;
      
      // Add personality to improvement
      const personalizedImprovement = personalityEngine.addPersonality(
        improvedCode,
        `improve this code for ${type}`,
        userPreferences?.aiPersonality
      );

      res.json({
        success: true,
        data: {
          improvedCode: personalizedImprovement,
          originalCode: code,
          improvementType: type,
          language: context?.primaryLanguage || 'javascript'
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
      const { code, error, context, userPreferences } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required for debugging'
        });
      }

      const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;

      const response = await openaiClient.createDebugCompletion(code, error, {
        language: context?.primaryLanguage || 'javascript'
      });

      const debugResult = response.choices[0].message.content;
      
      // Add personality to debug response
      const personalizedDebug = personalityEngine.addPersonality(
        debugResult,
        'debug this code',
        userPreferences?.aiPersonality
      );

      res.json({
        success: true,
        data: {
          debugResult: personalizedDebug,
          originalCode: code,
          error: error || null,
          language: context?.primaryLanguage || 'javascript'
        },
        message: 'Code debugged successfully'
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
   * Helper method to determine if code generation is needed
   */
  shouldGenerateCode(parseResult) {
    const codeKeywords = [
      'function', 'class', 'component', 'api', 'endpoint', 'database', 'query',
      'algorithm', 'data structure', 'sort', 'filter', 'map', 'reduce',
      'async', 'promise', 'callback', 'event', 'handler', 'middleware',
      'validation', 'authentication', 'authorization', 'encryption',
      'test', 'unit test', 'integration test', 'mock', 'stub'
    ];

    const text = parseResult.interpretation.toLowerCase();
    return codeKeywords.some(keyword => text.includes(keyword)) || 
           parseResult.specificAction?.includes('code') ||
           parseResult.specificAction?.includes('function') ||
           parseResult.specificAction?.includes('class');
  },

  /**
   * Build response with generated code
   */
  buildCodeResponse(codeResult, sassLevel) {
    const sassResponses = [
      "Here's your code, hot off the press! 🔥",
      "Ta-da! Your code is ready to rock! 🚀",
      "Boom! Code generated with style! 💅",
      "Your wish is my command! Here's the code! ✨",
      "Code magic happening right here! 🪄"
    ];

    const response = sassResponses[sassLevel % sassResponses.length] || sassResponses[0];
    
    return `${response}\n\n${codeResult.code}\n\n${codeResult.explanation || ''}`;
  },

  /**
   * Build clarification response
   */
  buildClarificationResponse(parseResult, sassLevel) {
    const sassResponses = [
      "I need a bit more info to help you properly! 🤔",
      "Could you be a bit more specific? I'm not a mind reader! 😅",
      "Hmm, I'm not quite sure what you mean. Can you clarify? 🤷‍♂️",
      "I'm getting mixed signals here. Help me out! 🙏",
      "Let's get on the same page! What exactly do you need? 💭"
    ];

    const response = sassResponses[sassLevel % sassResponses.length] || sassResponses[0];
    
    return `${response}\n\n${parseResult.clarifyingQuestions.join('\n')}`;
  },

  /**
   * Build interpretation response
   */
  buildInterpretationResponse(parseResult, sassLevel) {
    const sassResponses = [
      "Here's what I think you're asking for! 💡",
      "Let me break this down for you! 📝",
      "I interpreted your request as follows! 🎯",
      "Here's my take on what you need! 🤓",
      "Let me translate that for you! 🔄"
    ];

    const response = sassResponses[sassLevel % sassResponses.length] || sassResponses[0];
    
    return `${response}\n\n${parseResult.interpretation}`;
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

export default generateController;