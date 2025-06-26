// services/ai-service/src/services/codeGenerator.js
import openaiClient from './openaiClient.js';
import personalityEngine from './personalityEngine.js';
import { SUPPORTED_LANGUAGES, FRAMEWORKS } from '@lpa/shared';

class CodeGenerator {
  constructor() {
    // Template patterns for common code structures
    this.codeTemplates = {
      react_component: {
        pattern: 'React functional component',
        template: `import React from 'react';

const {{ComponentName}} = ({{props}}) => {
  {{hooks}}
  
  {{handlers}}
  
  return (
    {{jsx}}
  );
};

export default {{ComponentName}};`
      },
      
      express_route: {
        pattern: 'Express.js route handler',
        template: `// {{description}}
app.{{method}}('{{path}}', async (req, res) => {
  try {
    {{logic}}
    
    res.json({
      success: true,
      data: {{responseData}}
    });
  } catch (error) {
    console.error('{{errorContext}}:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});`
      },
      
      python_function: {
        pattern: 'Python function',
        template: `def {{function_name}}({{parameters}}):
    """
    {{docstring}}
    """
    {{body}}
    
    return {{return_value}}`
      }
    };
  }

  /**
   * Generate code based on parsed vague request
   */
  async generateCode(interpretation, context, userPreferences = {}) {
    try {
      // Build comprehensive prompt
      const prompt = this.buildCodeGenerationPrompt(interpretation, context, userPreferences);
      
      // Generate code using OpenAI
      const response = await openaiClient.createCodeCompletion(prompt, {
        language: context.primaryLanguage || 'javascript',
        framework: context.framework,
        maxTokens: 2000,
        temperature: 0.4 // Lower temperature for more consistent code
      });

      const generatedContent = response.choices[0].message.content;
      
      // Parse the generated response
      const parsedResponse = this.parseGeneratedResponse(generatedContent);
      
      // Add personality flair
      const sassyResponse = personalityEngine.addPersonality(
        parsedResponse.explanation,
        interpretation.originalText,
        userPreferences.aiPersonality
      );
      
      // Validate generated code
      const validation = this.validateGeneratedCode(parsedResponse.code, context);
      
      return {
        code: parsedResponse.code,
        explanation: sassyResponse,
        assumptions: interpretation.assumptions || [],
        confidence: interpretation.confidence,
        language: context.primaryLanguage || 'javascript',
        framework: context.framework,
        validation,
        alternatives: await this.generateAlternatives(interpretation, context),
        usage: this.generateUsageExample(parsedResponse.code, context)
      };

    } catch (error) {
      console.error('Code generation error:', error);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for code generation
   */
  buildCodeGenerationPrompt(interpretation, context, userPreferences) {
    const { primaryLanguage = 'javascript', framework, focusArea, relevantFiles } = context;
    const sassLevel = userPreferences.aiPersonality?.sassLevel || 5;
    
    let prompt = `I need you to generate ${primaryLanguage} code for this request: "${interpretation.originalText}"

INTERPRETATION: ${interpretation.interpretation}
SPECIFIC ACTION: ${interpretation.specificAction}

CONTEXT:
- Language: ${primaryLanguage}`;

    if (framework) {
      prompt += `\n- Framework: ${framework}`;
    }

    if (focusArea) {
      prompt += `\n- Current focus: ${focusArea.directory}`;
    }

    if (relevantFiles && relevantFiles.length > 0) {
      prompt += `\n- Relevant files: ${relevantFiles.slice(0, 3).map(f => f.path).join(', ')}`;
    }

    // Add file content for context (if available and not too large)
    if (relevantFiles && relevantFiles.length > 0) {
      const fileWithContent = relevantFiles.find(f => f.content && f.content.length < 2000);
      if (fileWithContent) {
        prompt += `\n\nRELEVANT CODE CONTEXT:\n\`\`\`${primaryLanguage}\n${fileWithContent.content}\n\`\`\``;
      }
    }

    prompt += `\n\nREQUIREMENTS:
1. Generate working, production-ready code
2. Include proper error handling
3. Add helpful comments
4. Follow ${primaryLanguage} best practices`;

    if (framework) {
      prompt += `\n5. Use ${framework} conventions`;
    }

    prompt += `\n6. Be slightly sassy (level ${sassLevel}/10) about the vague request but still helpful

ASSUMPTIONS I'M MAKING:
${interpretation.assumptions.map(a => `- ${a}`).join('\n')}

Please provide:
1. A brief sassy comment about the request
2. The complete code
3. Explanation of what it does
4. Any additional assumptions you made

Format as:
**Sassy Comment:** [your comment]

**Code:**
\`\`\`${primaryLanguage}
[your code here]
\`\`\`

**Explanation:** [what the code does]

**Additional Assumptions:** [any extra assumptions]`;

    return prompt;
  }

  /**
   * Parse the generated response from OpenAI
   */
  parseGeneratedResponse(content) {
    const sections = {
      sassyComment: '',
      code: '',
      explanation: '',
      assumptions: []
    };

    // Extract sassy comment
    const sassyMatch = content.match(/\*\*Sassy Comment:\*\*\s*(.*?)(?=\n\*\*|\n\n|\*\*|$)/s);
    if (sassyMatch) {
      sections.sassyComment = sassyMatch[1].trim();
    }

    // Extract code blocks
    const codeMatches = content.match(/```[\w]*\n([\s\S]*?)```/g);
    if (codeMatches && codeMatches.length > 0) {
      // Get the first code block
      const codeBlock = codeMatches[0];
      sections.code = codeBlock.replace(/```[\w]*\n/, '').replace(/```$/, '').trim();
    }

    // Extract explanation
    const explanationMatch = content.match(/\*\*Explanation:\*\*\s*(.*?)(?=\n\*\*|\n\n|\*\*|$)/s);
    if (explanationMatch) {
      sections.explanation = explanationMatch[1].trim();
    }

    // Extract additional assumptions
    const assumptionsMatch = content.match(/\*\*Additional Assumptions:\*\*\s*(.*?)(?=\n\*\*|\n\n|\*\*|$)/s);
    if (assumptionsMatch) {
      const assumptionsText = assumptionsMatch[1].trim();
      sections.assumptions = assumptionsText.split('\n').map(a => a.replace(/^[-*]\s*/, '').trim()).filter(a => a);
    }

    return sections;
  }

  /**
   * Validate generated code
   */
  validateGeneratedCode(code, context) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!code || code.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('No code generated');
      return validation;
    }

    // Basic syntax check
    this.performBasicSyntaxCheck(code, context.primaryLanguage, validation);

    // Framework-specific checks
    if (context.framework) {
      this.performFrameworkChecks(code, context.framework, validation);
    }

    // Security checks
    this.performSecurityChecks(code, validation);

    // Best practices checks
    this.performBestPracticesChecks(code, context.primaryLanguage, validation);

    return validation;
  }

  /**
   * Perform basic syntax validation
   */
  performBasicSyntaxCheck(code, language, validation) {
    // Basic checks for common syntax issues
    const checks = {
      javascript: {
        missingSemicolons: /[^;{}]\s*$/m,
        unclosedBrackets: /[{([]/g,
        unclosedQuotes: /["'`]/g
      },
      python: {
        missingColons: /(def|class|if|for|while|try|except|finally)\s+[^:]+$/m,
        indentationIssues: /^\s*[^#\s]/m
      }
    };

    const languageChecks = checks[language];
    if (!languageChecks) return;

    // Check for unclosed brackets
    const openBrackets = (code.match(/[{([]/g) || []).length;
    const closeBrackets = (code.match(/[})\]]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      validation.warnings.push('Possible unclosed brackets or parentheses');
    }

    // Check for unclosed quotes
    const quotes = code.match(/["'`]/g) || [];
    if (quotes.length % 2 !== 0) {
      validation.warnings.push('Possible unclosed quotes');
    }
  }

  /**
   * Perform framework-specific validation
   */
  performFrameworkChecks(code, framework, validation) {
    const frameworkChecks = {
      'react': {
        missingImport: /React|useState|useEffect/,
        missingExport: /export\s+default/,
        jsxSyntax: /<[A-Z][^>]*>/g
      },
      'express': {
        missingImport: /express/,
        routeHandler: /app\.(get|post|put|delete)/,
        responseHandling: /res\.(json|send|status)/
      }
    };

    const checks = frameworkChecks[framework.toLowerCase()];
    if (!checks) return;

    // Check for required imports
    if (checks.missingImport && !checks.missingImport.test(code)) {
      validation.suggestions.push(`Consider importing required ${framework} dependencies`);
    }
  }

  /**
   * Perform security validation
   */
  performSecurityChecks(code, validation) {
    const securityPatterns = [
      { pattern: /eval\s*\(/, risk: 'high', message: 'eval() usage detected - security risk' },
      { pattern: /innerHTML\s*=/, risk: 'medium', message: 'innerHTML usage detected - potential XSS risk' },
      { pattern: /document\.write/, risk: 'medium', message: 'document.write() usage detected - potential XSS risk' },
      { pattern: /sql\s*\+/, risk: 'medium', message: 'String concatenation in SQL detected - potential SQL injection' }
    ];

    securityPatterns.forEach(({ pattern, risk, message }) => {
      if (pattern.test(code)) {
        if (risk === 'high') {
          validation.errors.push(message);
          validation.isValid = false;
        } else {
          validation.warnings.push(message);
        }
      }
    });
  }

  /**
   * Perform best practices validation
   */
  performBestPracticesChecks(code, language, validation) {
    const bestPractices = {
      javascript: [
        { pattern: /var\s+/, message: 'Consider using const/let instead of var' },
        { pattern: /console\.log/, message: 'Consider removing console.log statements for production' },
        { pattern: /function\s+\w+\s*\([^)]*\)\s*{/, message: 'Consider using arrow functions for consistency' }
      ],
      python: [
        { pattern: /print\s*\(/, message: 'Consider using logging instead of print statements' },
        { pattern: /except\s*:/, message: 'Consider specifying exception types' }
      ]
    };

    const practices = bestPractices[language];
    if (!practices) return;

    practices.forEach(({ pattern, message }) => {
      if (pattern.test(code)) {
        validation.suggestions.push(message);
      }
    });
  }

  /**
   * Generate alternative approaches
   */
  async generateAlternatives(interpretation, context) {
    try {
      const prompt = `Generate 2-3 alternative approaches for this request: "${interpretation.originalText}"

Current approach: ${interpretation.interpretation}

Please provide alternatives that are:
1. Different in approach or methodology
2. Suitable for different use cases
3. With pros and cons for each

Format as:
**Alternative 1: [Name]**
- Approach: [description]
- Pros: [list]
- Cons: [list]
- When to use: [description]

**Alternative 2: [Name]**
...`;

      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a coding expert who provides alternative solutions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return this.parseAlternatives(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating alternatives:', error);
      return [];
    }
  }

  /**
   * Parse alternatives from response
   */
  parseAlternatives(content) {
    const alternatives = [];
    const alternativeBlocks = content.split(/\*\*Alternative \d+:/);

    alternativeBlocks.slice(1).forEach(block => {
      const lines = block.trim().split('\n');
      const name = lines[0].trim();
      
      const alternative = {
        name,
        approach: this.extractWhenToUse(block, 'Approach:'),
        pros: this.extractWhenToUse(block, 'Pros:'),
        cons: this.extractWhenToUse(block, 'Cons:'),
        whenToUse: this.extractWhenToUse(block, 'When to use:')
      };

      alternatives.push(alternative);
    });

    return alternatives;
  }

  /**
   * Extract specific section from text
   */
  extractWhenToUse(content, section) {
    const regex = new RegExp(`${section}\\s*(.*?)(?=\\n\\*\\*|\\n\\n|\\*\\*|$)`, 's');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Generate usage example for the code
   */
  generateUsageExample(code, context) {
    const language = context.primaryLanguage || 'javascript';
    
    // Simple usage example based on code patterns
    if (code.includes('function') || code.includes('def ')) {
      return `// Usage example:
// Call the function with appropriate parameters
// Example: functionName(param1, param2);`;
    }

    if (code.includes('class ')) {
      return `// Usage example:
// const instance = new ClassName();
// instance.methodName();`;
    }

    if (code.includes('export default')) {
      return `// Usage example:
// import ComponentName from './path/to/component';
// <ComponentName prop1="value" />`;
    }

    return `// Usage example:
// Copy and paste this code into your project
// Modify as needed for your specific use case`;
  }

  /**
   * Improve existing code
   */
  async improveCode(code, improvementType, context) {
    const improvementPrompts = {
      'performance': 'Optimize this code for better performance',
      'readability': 'Make this code more readable and maintainable',
      'security': 'Improve the security of this code',
      'error-handling': 'Add better error handling to this code',
      'documentation': 'Add comprehensive documentation to this code'
    };

    const prompt = `${improvementPrompts[improvementType] || 'Improve this code'}:

\`\`\`${context.primaryLanguage || 'javascript'}
${code}
\`\`\`

Please provide the improved version with explanations of the changes.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a code improvement expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error improving code:', error);
      throw new Error(`Failed to improve code: ${error.message}`);
    }
  }
}

// Create and export a singleton instance
const codeGenerator = new CodeGenerator();
export default codeGenerator;