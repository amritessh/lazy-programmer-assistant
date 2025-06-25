// services/ai-service/src/services/vagueParse.js
import { LAZY_PHRASES, CONFIDENCE_THRESHOLDS } from '@lpa/shared';
import openaiClient from './openaiClient.js';
import _ from 'lodash';

class VagueParser {
  constructor() {
    // Pattern matching for common lazy phrases
    this.lazyPatterns = {
      // Thing references
      thingReferences: [
        /\b(the|that|this)\s+(thing|stuff|object|component|element|widget|thingy|doohickey)\b/gi,
        /\b(it|that)\b/gi
      ],
      
      // Action requests
      makeActions: [
        /\bmake\s+(it|the\s+\w+)\s+(work|do|happen|better|good|pretty)\b/gi,
        /\b(create|build|add|generate)\s+(the|a|an)\s+\w+\b/gi,
        /\b(fix|repair|debug)\s+(the|it|that)\b/gi
      ],
      
      // Vague descriptions
      vagueDescriptions: [
        /\bdo\s+(the\s+)?stuff\b/gi,
        /\bhandle\s+(the\s+)?\w+\b/gi,
        /\bmake\s+it\s+(better|good|nice|pretty|work)\b/gi,
        /\b(improve|optimize|clean\s+up|refactor)\s+(it|this|that)\b/gi
      ],
      
      // Error fixes
      errorFixes: [
        /\b(fix|solve|resolve|debug)\s+(the\s+)?(error|bug|issue|problem)\b/gi,
        /\bmake\s+it\s+(not\s+)?(crash|break|fail)\b/gi,
        /\bstop\s+(the\s+)?(error|crashing|breaking)\b/gi
      ],
      
      // UI actions
      uiActions: [
        /\badd\s+(the|a|an)\s+(button|form|modal|popup|dropdown|menu)\b/gi,
        /\bmake\s+it\s+(clickable|interactive|responsive|pretty)\b/gi,
        /\b(style|design|beautify)\s+(it|this|that)\b/gi
      ]
    };

    // Context clues for better interpretation
    this.contextClues = {
      // File type indicators
      frontend: ['component', 'page', 'view', 'template', 'ui', 'jsx', 'tsx', 'vue', 'html', 'css'],
      backend: ['api', 'route', 'controller', 'service', 'model', 'database', 'server'],
      testing: ['test', 'spec', 'mock', 'fixture'],
      config: ['config', 'setting', 'env', 'setup'],
      
      // Action type indicators
      crud: ['create', 'read', 'update', 'delete', 'save', 'fetch', 'get', 'post', 'put'],
      ui: ['click', 'hover', 'focus', 'submit', 'validate', 'show', 'hide', 'toggle'],
      data: ['process', 'transform', 'filter', 'sort', 'map', 'reduce', 'parse'],
      error: ['error', 'exception', 'bug', 'issue', 'problem', 'crash', 'fail']
    };
  }

  /**
   * Parse a vague request into structured interpretation
   */
  async parseVagueRequest(text, context = null, userPreferences = null) {
    try {
      // Clean and normalize input
      const normalizedText = this.normalizeText(text);
      
      // Extract patterns and keywords
      const patterns = this.extractPatterns(normalizedText);
      
      // Analyze context clues
      const contextAnalysis = this.analyzeContext(normalizedText, context);
      
      // Generate multiple interpretations
      const interpretations = await this.generateInterpretations(
        normalizedText, 
        patterns, 
        contextAnalysis, 
        userPreferences
      );
      
      // Score and rank interpretations
      const rankedInterpretations = this.rankInterpretations(interpretations, context);
      
      // Select best interpretation
      const bestInterpretation = rankedInterpretations[0];
      
      // Generate assumptions and clarifying questions
      const assumptions = this.generateAssumptions(bestInterpretation, context);
      const clarifyingQuestions = this.generateClarifyingQuestions(rankedInterpretations);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(bestInterpretation, patterns, context);
      
      return {
        originalText: text,
        interpretation: bestInterpretation.description,
        specificAction: bestInterpretation.action,
        assumptions,
        confidence,
        alternativeInterpretations: rankedInterpretations.slice(1, 3),
        needsMoreInfo: confidence < CONFIDENCE_THRESHOLDS.MEDIUM,
        clarifyingQuestions: confidence < CONFIDENCE_THRESHOLDS.MEDIUM ? clarifyingQuestions : [],
        suggestedActions: bestInterpretation.suggestedActions || [],
        detectedPatterns: patterns,
        contextAnalysis
      };

    } catch (error) {
      console.error('Error parsing vague request:', error);
      throw new Error('Failed to parse vague request');
    }
  }

  /**
   * Normalize text for better parsing
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract patterns from text
   */
  extractPatterns(text) {
    const patterns = {
      thingReferences: [],
      makeActions: [],
      vagueDescriptions: [],
      errorFixes: [],
      uiActions: [],
      intensity: 'medium'
    };

    Object.entries(this.lazyPatterns).forEach(([category, regexes]) => {
      regexes.forEach(regex => {
        const matches = text.match(regex);
        if (matches) {
          patterns[category] = patterns[category] || [];
          patterns[category].push(...matches);
        }
      });
    });

    // Detect intensity/urgency
    if (text.includes('asap') || text.includes('urgent') || text.includes('now')) {
      patterns.intensity = 'high';
    } else if (text.includes('whenever') || text.includes('maybe') || text.includes('later')) {
      patterns.intensity = 'low';
    }

    return patterns;
  }

  /**
   * Analyze context for better interpretation
   */
  analyzeContext(text, context) {
    const analysis = {
      area: 'unknown',
      actionType: 'unknown',
      relevantFiles: [],
      suggestedFocus: null
    };

    if (!context) return analysis;

    // Determine area based on context
    const { primaryLanguage, framework, focusArea, relevantFiles } = context;
    
    // Match text against context clues
    Object.entries(this.contextClues).forEach(([area, keywords]) => {
      const matchCount = keywords.filter(keyword => 
        text.includes(keyword) || 
        (relevantFiles && relevantFiles.some(file => 
          file.path.toLowerCase().includes(keyword)
        ))
      ).length;
      
      if (matchCount > 0) {
        analysis.area = area;
      }
    });

    // Find relevant files
    if (relevantFiles) {
      analysis.relevantFiles = relevantFiles.slice(0, 5); // Top 5 relevant files
    }

    // Suggest focus based on recent activity
    if (focusArea) {
      analysis.suggestedFocus = focusArea.directory;
    }

    return analysis;
  }

  /**
   * Generate multiple interpretations using AI
   */
  async generateInterpretations(text, patterns, contextAnalysis, userPreferences) {
    const interpretations = [];
    
    // Rule-based interpretations first
    interpretations.push(...this.generateRuleBasedInterpretations(text, patterns, contextAnalysis));
    
    // AI-enhanced interpretations
    try {
      const aiInterpretations = await this.generateAIInterpretations(text, contextAnalysis, userPreferences);
      interpretations.push(...aiInterpretations);
    } catch (error) {
      console.warn('AI interpretation failed, using rule-based only:', error.message);
    }

    return interpretations;
  }

  /**
   * Generate rule-based interpretations
   */
  generateRuleBasedInterpretations(text, patterns, contextAnalysis) {
    const interpretations = [];

    // Error fixing interpretations
    if (patterns.errorFixes && patterns.errorFixes.length > 0) {
      interpretations.push({
        description: 'Fix errors or bugs in the code',
        action: 'debug_and_fix',
        confidence: 0.8,
        suggestedActions: [
          'Review console errors',
          'Check for syntax errors',
          'Validate function calls',
          'Test error handling'
        ],
        source: 'rule_based',
        category: 'debugging'
      });
    }

    // UI action interpretations
    if (patterns.uiActions && patterns.uiActions.length > 0) {
      interpretations.push({
        description: 'Add or modify user interface elements',
        action: 'create_ui_component',
        confidence: 0.7,
        suggestedActions: [
          'Create new component',
          'Add event handlers',
          'Style with CSS',
          'Implement user interactions'
        ],
        source: 'rule_based',
        category: 'ui'
      });
    }

    // Generic "make it work" interpretations
    if (patterns.makeActions && patterns.makeActions.length > 0) {
      if (contextAnalysis.area === 'frontend') {
        interpretations.push({
          description: 'Implement or fix frontend functionality',
          action: 'implement_frontend_feature',
          confidence: 0.6,
          suggestedActions: [
            'Add missing props or state',
            'Implement event handlers',
            'Fix component rendering',
            'Add proper styling'
          ],
          source: 'rule_based',
          category: 'frontend'
        });
      } else if (contextAnalysis.area === 'backend') {
        interpretations.push({
          description: 'Implement or fix backend functionality',
          action: 'implement_backend_feature',
          confidence: 0.6,
          suggestedActions: [
            'Add API endpoints',
            'Implement business logic',
            'Fix database queries',
            'Add error handling'
          ],
          source: 'rule_based',
          category: 'backend'
        });
      } else {
        interpretations.push({
          description: 'Implement missing functionality',
          action: 'general_implementation',
          confidence: 0.5,
          suggestedActions: [
            'Add missing functions',
            'Implement core logic',
            'Fix broken features',
            'Add proper error handling'
          ],
          source: 'rule_based',
          category: 'general'
        });
      }
    }

    // Vague description interpretations
    if (patterns.vagueDescriptions && patterns.vagueDescriptions.length > 0) {
      interpretations.push({
        description: 'Improve or refactor existing code',
        action: 'improve_code',
        confidence: 0.5,
        suggestedActions: [
          'Refactor for better readability',
          'Optimize performance',
          'Add error handling',
          'Improve code structure'
        ],
        source: 'rule_based',
        category: 'improvement'
      });
    }

    return interpretations;
  }

  /**
   * Generate AI-enhanced interpretations
   */
  async generateAIInterpretations(text, contextAnalysis, userPreferences) {
    const systemPrompt = this.buildSystemPrompt(contextAnalysis, userPreferences);
    const userPrompt = this.buildUserPrompt(text, contextAnalysis);

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = response.choices[0].message.content;
      return this.parseAIResponse(aiResponse);

    } catch (error) {
      console.error('OpenAI API error:', error);
      return [];
    }
  }

  /**
   * Build system prompt for AI interpretation
   */
  buildSystemPrompt(contextAnalysis, userPreferences) {
    const sassLevel = userPreferences?.aiPersonality?.sassLevel || 5;
    const verbosity = userPreferences?.aiPersonality?.verbosity || 'detailed';
    
    return `You are a sassy but helpful AI assistant that specializes in interpreting vague programming requests. 

Your job is to translate lazy, unclear requests into specific, actionable programming tasks.

Context:
- Primary area: ${contextAnalysis.area}
- Suggested focus: ${contextAnalysis.suggestedFocus || 'unknown'}
- Sass level: ${sassLevel}/10 (1=polite, 10=maximum sass)
- Verbosity: ${verbosity}

Rules:
1. Generate 2-3 different interpretations of the vague request
2. Be specific about what needs to be implemented
3. Include confidence scores (0.0-1.0)
4. Suggest concrete actions
5. Add appropriate level of sass based on the sass level
6. If confidence is low, ask clarifying questions

Format your response as JSON with this structure:
{
  "interpretations": [
    {
      "description": "What you think they want",
      "action": "specific_action_type",
      "confidence": 0.0-1.0,
      "suggestedActions": ["action1", "action2"],
      "sassyComment": "Your sassy response to their vague request"
    }
  ],
  "clarifyingQuestions": ["question1", "question2"]
}`;
  }

  /**
   * Build user prompt for AI interpretation
   */
  buildUserPrompt(text, contextAnalysis) {
    return `The user said: "${text}"

Context information:
- Working area: ${contextAnalysis.area}
- Relevant files: ${contextAnalysis.relevantFiles.map(f => f.path).join(', ')}
- Suggested focus: ${contextAnalysis.suggestedFocus || 'none'}

Please interpret this vague request and provide specific, actionable interpretations with appropriate sass.`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.interpretations.map(interp => ({
        ...interp,
        source: 'ai_enhanced',
        confidence: Math.max(0, Math.min(1, interp.confidence)) // Clamp between 0-1
      }));
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
      return [];
    }
  }

  /**
   * Rank interpretations by relevance and confidence
   */
  rankInterpretations(interpretations, context) {
    return interpretations
      .map(interp => ({
        ...interp,
        finalScore: this.calculateFinalScore(interp, context)
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Calculate final score for interpretation ranking
   */
  calculateFinalScore(interpretation, context) {
    let score = interpretation.confidence;
    
    // Boost AI-enhanced interpretations slightly
    if (interpretation.source === 'ai_enhanced') {
      score += 0.1;
    }
    
    // Boost interpretations that match context area
    if (context && context.area && interpretation.category === context.area) {
      score += 0.2;
    }
    
    // Boost interpretations with more specific actions
    if (interpretation.suggestedActions && interpretation.suggestedActions.length > 3) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Generate assumptions based on interpretation
   */
  generateAssumptions(interpretation, context) {
    const assumptions = [];
    
    // Context-based assumptions
    if (context) {
      if (context.primaryLanguage) {
        assumptions.push(`You're working in ${context.primaryLanguage}`);
      }
      if (context.framework) {
        assumptions.push(`You're using ${context.framework} framework`);
      }
      if (context.focusArea) {
        assumptions.push(`You're currently focused on ${context.focusArea.directory}`);
      }
    }
    
    // Interpretation-based assumptions
    assumptions.push(`You want to ${interpretation.action.replace(/_/g, ' ')}`);
    
    if (interpretation.category === 'debugging') {
      assumptions.push('There are existing errors that need fixing');
    }
    
    if (interpretation.category === 'ui') {
      assumptions.push('This involves user interface changes');
    }
    
    return assumptions;
  }

  /**
   * Generate clarifying questions
   */
  generateClarifyingQuestions(interpretations) {
    const questions = [];
    
    if (interpretations.length > 1) {
      questions.push('Which of these interpretations is closest to what you want?');
      interpretations.slice(0, 3).forEach((interp, index) => {
        questions.push(`${index + 1}. ${interp.description}`);
      });
    }
    
    // Add specific questions based on common ambiguities
    questions.push('What specific functionality should be implemented?');
    questions.push('Are there any particular files or components I should focus on?');
    
    return questions.slice(0, 5); // Limit to 5 questions
  }

  /**
   * Calculate overall confidence in interpretation
   */
  calculateConfidence(interpretation, patterns, context) {
    let confidence = interpretation.confidence;
    
    // Boost confidence if we have good context
    if (context && context.focusArea) {
      confidence += 0.1;
    }
    
    // Boost confidence if we detected strong patterns
    const totalPatterns = Object.values(patterns).flat().length;
    if (totalPatterns > 2) {
      confidence += 0.1;
    }
    
    // Reduce confidence for very vague requests
    if (interpretation.originalText && interpretation.originalText.length < 10) {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }
}

export default new VagueParser();