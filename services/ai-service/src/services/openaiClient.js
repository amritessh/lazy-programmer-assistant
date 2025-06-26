// services/ai-service/src/services/openaiClient.js
import OpenAI from 'openai';

class OpenAIClient {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Rate limiting and retry configuration
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }

  /**
   * Create chat completion with retry logic
   */
  async createChatCompletion(options) {
    const defaultOptions = {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };

    const finalOptions = { ...defaultOptions, ...options };

    return this.withRetry(() =>
      this.client.chat.completions.create(finalOptions)
    );
  }

  /**
   * Create completion for code generation
   */
  async createCodeCompletion(prompt, context = {}) {
    const {
      language = 'javascript',
      framework = null,
      maxTokens = 1500,
      temperature = 0.3 // Lower temperature for code generation
    } = context;

    const systemPrompt = this.buildCodeGenerationSystemPrompt(
      language,
      framework
    );

    return this.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    });
  }

  /**
   * Create completion for code explanation
   */
  async createExplanationCompletion(code, context = {}) {
    const {
      language = 'javascript',
      explainLevel = 'detailed' // brief, detailed, beginner
    } = context;

    const systemPrompt = this.buildExplanationSystemPrompt(
      language,
      explainLevel
    );
    const userPrompt = `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    return this.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });
  }

  /**
   * Create completion for code debugging
   */
  async createDebuggingCompletion(code, error, context = {}) {
    const { language = 'javascript', framework = null } = context;

    const systemPrompt = this.buildDebuggingSystemPrompt(language, framework);
    const userPrompt = `I'm getting this error in my ${language} code:\n\nError: ${error}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease help me fix it.`;

    return this.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1500
    });
  }

  /**
   * Build system prompt for code generation
   */
  buildCodeGenerationSystemPrompt(language, framework) {
    let prompt = `You are an expert ${language} developer with a sassy but helpful personality. You write clean, efficient, and well-documented code.

Your task is to generate code based on vague or lazy requests. You should:
1. Write functional, production-ready code
2. Include proper error handling
3. Add helpful comments
4. Follow best practices for ${language}
5. Be slightly sassy about lazy requests but still helpful`;

    if (framework) {
      prompt += `\n6. Use ${framework} conventions and best practices`;
    }

    prompt += `\n\nFormat your response as:
1. A brief sassy comment about the request
2. The code wrapped in \`\`\`${language} code blocks
3. A brief explanation of what the code does
4. Any assumptions you made`;

    return prompt;
  }

  /**
   * Build system prompt for code explanation
   */
  buildExplanationSystemPrompt(language, explainLevel) {
    const levelDescriptions = {
      brief: 'concise explanations focusing on the main purpose',
      detailed: 'thorough explanations covering all aspects',
      beginner: 'beginner-friendly explanations with examples'
    };

    return `You are a ${language} expert who explains code clearly. 

Provide ${levelDescriptions[explainLevel]} of the given code.

Your explanation should cover:
1. What the code does (main purpose)
2. How it works (key logic)
3. Important concepts or patterns used
4. Any potential issues or improvements

Keep your tone friendly and educational.`;
  }

  /**
   * Build system prompt for debugging
   */
  buildDebuggingSystemPrompt(language, framework) {
    let prompt = `You are a ${language} debugging expert. You help developers identify and fix bugs in their code.

Your debugging approach:
1. Analyze the error message and code
2. Identify the root cause
3. Provide a clear fix
4. Explain why the error occurred
5. Suggest improvements to prevent similar issues`;

    if (framework) {
      prompt += `\n6. Consider ${framework}-specific debugging techniques`;
    }

    prompt += `\n\nFormat your response as:
1. **Problem**: Brief description of the issue
2. **Solution**: The fixed code in \`\`\`${language} blocks
3. **Explanation**: Why this fixes the problem
4. **Prevention**: How to avoid this in the future`;

    return prompt;
  }

  /**
   * Retry wrapper for API calls
   */
  async withRetry(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on certain errors
      if (this.shouldNotRetry(error) || attempt >= this.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = this.baseDelay * Math.pow(2, attempt - 1);

      console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
      await this.sleep(delay);

      return this.withRetry(fn, attempt + 1);
    }
  }

  /**
   * Determine if an error should not be retried
   */
  shouldNotRetry(error) {
    // Don't retry on authentication errors, rate limits, or invalid requests
    return (
      error.status === 401 ||
      error.status === 403 ||
      error.status === 429 ||
      error.status === 400
    );
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to fit within token limit
   */
  truncateToTokenLimit(text, maxTokens = 4000) {
    const estimatedTokens = this.estimateTokens(text);

    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Remove characters to fit within token limit
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars) + '...';
  }

  /**
   * Health check for the OpenAI client
   */
  async healthCheck() {
    try {
      // Try a simple API call to test connectivity
      const response = await this.client.models.list();
      return {
        status: 'healthy',
        message: 'OpenAI API connection successful',
        models: response.data.length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        error: error
      };
    }
  }
}

// Create and export a singleton instance
const openaiClient = new OpenAIClient();

export default openaiClient;
