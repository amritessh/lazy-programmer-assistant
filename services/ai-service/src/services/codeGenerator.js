// services/ai-service/src/services/codeGenerator.js
const openaiClient = require('./openaiClient');
const personalityEngine = require('./personalityEngine');
const { SUPPORTED_LANGUAGES, FRAMEWORKS } = require('@lpa/shared');

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
      // Take the largest code block (most likely the main code)
      sections.code = codeMatches
        .map(match => match.replace(/```[\w]*\n|```/g, ''))
        .sort((a, b) => b.length - a.length)[0]
        .trim();
    }

    // Extract explanation
    const explanationMatch = content.match(/\*\*Explanation:\*\*\s*(.*?)(?=\n\*\*|\n\n\*\*|$)/s);
    if (explanationMatch) {
      sections.explanation = explanationMatch[1].trim();
    }

    // Extract additional assumptions
    const assumptionsMatch = content.match(/\*\*Additional Assumptions:\*\*\s*(.*?)$/s);
    if (assumptionsMatch) {
      const assumptionsText = assumptionsMatch[1].trim();
      sections.assumptions = assumptionsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(assumption => assumption.length > 0);
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
      validation.errors.push('No code was generated');
      return validation;
    }

    // Basic syntax checks
    try {
      this.performBasicSyntaxCheck(code, context.primaryLanguage, validation);
    } catch (error) {
      validation.warnings.push(`Syntax validation failed: ${error.message}`);
    }

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
   * Perform basic syntax checks
   */
  performBasicSyntaxCheck(code, language, validation) {
    if (language === 'javascript' || language === 'typescript') {
      // Check for common JS/TS issues
      if (code.includes('var ')) {
        validation.suggestions.push('Consider using "let" or "const" instead of "var"');
      }
      
      if (!code.includes('try') && !code.includes('catch') && code.length > 200) {
        validation.suggestions.push('Consider adding error handling with try/catch');
      }
      
      // Check for missing semicolons in statement lines
      const lines = code.split('\n');
      const statementLines = lines.filter(line => 
        line.trim() && 
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('/*') &&
        !line.trim().endsWith('{') &&
        !line.trim().endsWith('}') &&
        line.includes('=') || line.includes('return') || line.includes('console.')
      );
      
      const missingSemicolons = statementLines.filter(line => 
        !line.trim().endsWith(';') && !line.trim().endsWith(',')
      ).length;
      
      if (missingSemicolons > statementLines.length * 0.5) {
        validation.suggestions.push('Consider adding semicolons for consistency');
      }
    }
  }

  /**
   * Perform framework-specific checks
   */
  performFrameworkChecks(code, framework, validation) {
    if (framework === 'react') {
      if (!code.includes('import React')) {
        validation.warnings.push('React component might be missing React import');
      }
      
      if (code.includes('useState') && !code.includes('import') && !code.includes('React.useState')) {
        validation.warnings.push('useState hook might need to be imported');
      }
      
      if (code.includes('className') && code.includes('class=')) {
        validation.errors.push('Mixed usage of className and class attributes');
      }
    }
    
    if (framework === 'express') {
      if (!code.includes('res.') && code.includes('app.')) {
        validation.warnings.push('Express route might be missing response handling');
      }
      
      if (!code.includes('try') && !code.includes('catch')) {
        validation.suggestions.push('Express routes should include error handling');
      }
    }
  }

  /**
   * Perform security checks
   */
  performSecurityChecks(code, validation) {
    // Check for potential security issues
    if (code.includes('eval(')) {
      validation.warnings.push('Usage of eval() can be dangerous');
    }
    
    if (code.includes('innerHTML') && !code.includes('sanitiz')) {
      validation.warnings.push('Direct innerHTML usage might be vulnerable to XSS');
    }
    
    if (code.includes('document.write')) {
      validation.warnings.push('document.write can be dangerous and is deprecated');
    }
    
    // SQL injection checks
    if (code.includes('SELECT') && code.includes('+') && code.includes('req.')) {
      validation.warnings.push('Potential SQL injection vulnerability - use parameterized queries');
    }
  }

  /**
   * Perform best practices checks
   */
  performBestPracticesChecks(code, language, validation) {
    // Check for console.log in production code
    if (code.includes('console.log') && !code.includes('DEBUG')) {
      validation.suggestions.push('Consider using proper logging instead of console.log');
    }
    
    // Check for proper function naming
    const functionNames = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    if (functionNames) {
      const badNames = functionNames.filter(name => 
        name.includes('temp') || name.includes('test') || name.includes('foo')
      );
      if (badNames.length > 0) {
        validation.suggestions.push('Consider using more descriptive function names');
      }
    }
    
    // Check for magic numbers
    const numbers = code.match(/\b\d{2,}\b/g);
    if (numbers && numbers.length > 2) {
      validation.suggestions.push('Consider extracting magic numbers into named constants');
    }
  }

  /**
   * Generate alternative implementations
   */
  async generateAlternatives(interpretation, context) {
    try {
      const alternativePrompt = `Generate 2 alternative implementations for: "${interpretation.originalText}"

Original interpretation: ${interpretation.interpretation}

Context: ${context.primaryLanguage}${context.framework ? ` with ${context.framework}` : ''}

Provide 2 different approaches:
1. **Alternative 1**: A simpler/more direct approach
2. **Alternative 2**: A more robust/feature-rich approach

For each alternative, provide:
- Brief description
- Code snippet
- When to use this approach`;

      const response = await openaiClient.createCodeCompletion(alternativePrompt, {
        language: context.primaryLanguage,
        framework: context.framework,
        maxTokens: 1000,
        temperature: 0.6
      });

      return this.parseAlternatives(response.choices[0].message.content);
    } catch (error) {
      console.warn('Failed to generate alternatives:', error.message);
      return [];
    }
  }

  /**
   * Parse alternative implementations
   */
  parseAlternatives(content) {
    const alternatives = [];
    const altMatches = content.match(/\*\*Alternative \d+\*\*:[\s\S]*?(?=\*\*Alternative \d+\*\*:|$)/g);
    
    if (altMatches) {
      altMatches.forEach((match, index) => {
        const codeMatch = match.match(/```[\w]*\n([\s\S]*?)```/);
        const descriptionMatch = match.match(/\*\*Alternative \d+\*\*:\s*(.*?)(?=```|\n\n|$)/s);
        
        if (codeMatch && descriptionMatch) {
          alternatives.push({
            id: index + 1,
            description: descriptionMatch[1].trim(),
            code: codeMatch[1].trim(),
            whenToUse: this.extractWhenToUse(match)
          });
        }
      });
    }
    
    return alternatives;
  }

  /**
   * Extract "when to use" information
   */
  extractWhenToUse(content) {
    const whenMatch = content.match(/when to use[:\s]*(.*?)(?=\n\*\*|\n\n|$)/si);
    return whenMatch ? whenMatch[1].trim() : 'General purpose implementation';
  }

  /**
   * Generate usage example
   */
  generateUsageExample(code, context) {
    // Simple heuristic-based usage example generation
    if (context.framework === 'react' && code.includes('const ') && code.includes('export default')) {
      const componentName = code.match(/const\s+(\w+)\s*=/);
      if (componentName) {
        return `// Usage example:
import ${componentName[1]} from './${componentName[1]}';

function App() {
  return (
    <div>
      <${componentName[1]} />
    </div>
  );
}`;
      }
    }
    
    if (context.primaryLanguage === 'javascript' && code.includes('function')) {
      const functionName = code.match(/function\s+(\w+)/);
      if (functionName) {
        return `// Usage example:
const result = ${functionName[1]}();
console.log(result);`;
      }
    }
    
    return '// Usage example not available';
  }

  /**
   * Improve existing code
   */
  async improveCode(code, improvementType, context) {
    const improvementPrompts = {
      performance: 'Optimize this code for better performance',
      readability: 'Refactor this code for better readability and maintainability',
      security: 'Improve the security of this code',
      error_handling: 'Add proper error handling to this code',
      testing: 'Add unit tests for this code'
    };

    const prompt = `${improvementPrompts[improvementType] || 'Improve this code'}:

\`\`\`${context.primaryLanguage}
${code}
\`\`\`

Context: ${context.primaryLanguage}${context.framework ? ` with ${context.framework}` : ''}

Provide:
1. The improved code
2. Explanation of changes made
3. Benefits of the improvements`;

    const response = await openaiClient.createCodeCompletion(prompt, {
      language: context.primaryLanguage,
      framework: context.framework,
      temperature: 0.4
    });

    return this.parseGeneratedResponse(response.choices[0].message.content);
  }
}

module.exports = new CodeGenerator();