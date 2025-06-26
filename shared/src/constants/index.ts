// shared/src/constants/index.ts

export const API_ROUTES = {
    // Chat routes
    CHAT: '/api/chat',
    CHAT_SESSIONS: '/api/chat/sessions',
    CHAT_MESSAGES: '/api/chat/messages',
    
    // Project routes
    PROJECTS: '/api/projects',
    PROJECT_CONTEXT: '/api/projects/:id/context',
    PROJECT_FILES: '/api/projects/:id/files',
    
    // User routes
    USER_PROFILE: '/api/user/profile',
    USER_PREFERENCES: '/api/user/preferences',
    
    // File routes
    FILES: '/api/files',
    FILE_UPLOAD: '/api/files/upload',
    FILE_ANALYZE: '/api/files/analyze',
    
    // AI routes
    AI_GENERATE: '/api/ai/generate',
    AI_PARSE: '/api/ai/parse',
    
    // Learning routes
    LEARNING_FEEDBACK: '/api/learning/feedback',
    LEARNING_PATTERNS: '/api/learning/patterns',
  } as const;
  
  export const SERVICE_PORTS = {
    API_GATEWAY: 3001,
    CONTEXT_SERVICE: 3002,
    AI_SERVICE: 3003,
    LEARNING_SERVICE: 3004,
    FILE_SERVICE: 3005,
  } as const;
  
  export const CONFIDENCE_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
    VERY_HIGH: 0.9,
  } as const;
  
  export const LAZY_PHRASES = {
    // Thing references
    THING_REFERENCES: [
      'the thing',
      'that thing',
      'this thing',
      'the stuff',
      'that stuff',
      'this stuff',
      'the object',
      'the component',
      'the element',
      'the widget',
      'the thingy',
      'the doohickey'
    ],
    
    // Action requests
    MAKE_ACTIONS: [
      'make it work',
      'make it do',
      'make it happen',
      'make the thing',
      'create the thing',
      'build the thing',
      'add the thing',
      'fix the thing'
    ],
    
    // Vague descriptions
    VAGUE_DESCRIPTIONS: [
      'do the stuff',
      'handle the thing',
      'process the data',
      'make it better',
      'improve it',
      'optimize it',
      'clean it up',
      'refactor it'
    ],
    
    // Error fixes
    ERROR_FIXES: [
      'fix the error',
      'fix the bug',
      'make it not crash',
      'stop the error',
      'debug it',
      'resolve the issue'
    ],
    
    // UI actions
    UI_ACTIONS: [
      'add the button',
      'make it clickable',
      'add the form',
      'make it pretty',
      'style it',
      'make it responsive'
    ]
  } as const;
  
  export const PERSONALITY_RESPONSES = {
    SASSY_RESPONSES: [
      "Really? '{input}'? That's the best you can do?",
      "Oh, so we're being *super* specific today, I see.",
      "Let me just read your mind since you're being so descriptive.",
      "'{input}' - truly the pinnacle of technical communication.",
      "I'm impressed by your attention to detail. And by impressed, I mean concerned."
    ],
    
    HELPFUL_RESPONSES: [
      "I think I know what you're after. Here's my best guess:",
      "Based on your project context, you probably want:",
      "Let me translate that into actual code:",
      "I'm going to assume you mean:",
      "Here's what I think you're trying to do:"
    ],
    
    ASSUMPTION_RESPONSES: [
      "I'm assuming you want {assumption} because {reason}.",
      "Since you said '{input}', I'm guessing you need {assumption}.",
      "Based on your recent work, you probably want {assumption}.",
      "I notice you're working on {context}, so I assume you need {assumption}."
    ],
    
    CLARIFICATION_RESPONSES: [
      "I need a bit more info. Are you trying to:",
      "Could you clarify - do you want to:",
      "I can help, but I need to know:",
      "Before I generate code, tell me:"
    ]
  } as const;
  
  export const SUPPORTED_LANGUAGES = {
    JAVASCRIPT: 'javascript',
    TYPESCRIPT: 'typescript',
    PYTHON: 'python',
    JAVA: 'java',
    CSHARP: 'csharp',
    CPP: 'cpp',
    RUST: 'rust',
    GO: 'go',
    PHP: 'php',
    RUBY: 'ruby',
    HTML: 'html',
    CSS: 'css',
    SQL: 'sql',
    BASH: 'bash',
  } as const;
  
  export const FRAMEWORKS = {
    REACT: 'react',
    VUE: 'vue',
    ANGULAR: 'angular',
    SVELTE: 'svelte',
    NEXTJS: 'nextjs',
    NUXTJS: 'nuxtjs',
    EXPRESS: 'express',
    FASTAPI: 'fastapi',
    DJANGO: 'django',
    FLASK: 'flask',
    SPRING: 'spring',
    LARAVEL: 'laravel',
    RAILS: 'rails',
  } as const;
  
  export const FILE_EXTENSIONS = {
    [SUPPORTED_LANGUAGES.JAVASCRIPT]: ['.js', '.jsx', '.mjs'],
    [SUPPORTED_LANGUAGES.TYPESCRIPT]: ['.ts', '.tsx'],
    [SUPPORTED_LANGUAGES.PYTHON]: ['.py', '.pyw'],
    [SUPPORTED_LANGUAGES.JAVA]: ['.java'],
    [SUPPORTED_LANGUAGES.CSHARP]: ['.cs'],
    [SUPPORTED_LANGUAGES.CPP]: ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
    [SUPPORTED_LANGUAGES.RUST]: ['.rs'],
    [SUPPORTED_LANGUAGES.GO]: ['.go'],
    [SUPPORTED_LANGUAGES.PHP]: ['.php'],
    [SUPPORTED_LANGUAGES.RUBY]: ['.rb'],
    [SUPPORTED_LANGUAGES.HTML]: ['.html', '.htm'],
    [SUPPORTED_LANGUAGES.CSS]: ['.css', '.scss', '.sass', '.less'],
    [SUPPORTED_LANGUAGES.SQL]: ['.sql'],
    [SUPPORTED_LANGUAGES.BASH]: ['.sh', '.bash'],
  } as const;
  
  export const ERROR_MESSAGES = {
    INVALID_REQUEST: 'Invalid request format',
    MISSING_CONTEXT: 'Project context is required',
    UNSUPPORTED_LANGUAGE: 'Unsupported programming language',
    AI_SERVICE_ERROR: 'AI service temporarily unavailable',
    CONTEXT_ANALYSIS_FAILED: 'Failed to analyze project context',
    FILE_UPLOAD_FAILED: 'File upload failed',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    PROJECT_NOT_FOUND: 'Project not found',
    SESSION_NOT_FOUND: 'Chat session not found',
  } as const;
  
  export const SUCCESS_MESSAGES = {
    CODE_GENERATED: 'Code generated successfully',
    CONTEXT_ANALYZED: 'Project context analyzed successfully',
    FILE_UPLOADED: 'Files uploaded successfully',
    PROJECT_CREATED: 'Project created successfully',
    USER_REGISTERED: 'User registered successfully',
    USER_LOGGED_IN: 'User logged in successfully',
    PREFERENCES_UPDATED: 'User preferences updated successfully',
  } as const;
  
  export const HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  } as const;
  
  export const VALIDATION_RULES = {
    MESSAGE_MAX_LENGTH: 10000,
    PROJECT_NAME_MAX_LENGTH: 255,
    FILE_NAME_MAX_LENGTH: 255,
    USER_NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
  } as const;
  
  export const RATE_LIMITS = {
    CHAT_MESSAGES_PER_MINUTE: 30,
    FILE_UPLOADS_PER_HOUR: 100,
    AI_REQUESTS_PER_MINUTE: 20,
    CONTEXT_ANALYSIS_PER_HOUR: 50,
  } as const;
  
  export const CACHE_DURATIONS = {
    PROJECT_CONTEXT: 300, // 5 minutes
    USER_PREFERENCES: 3600, // 1 hour
    FILE_ANALYSIS: 1800, // 30 minutes
    AI_RESPONSES: 600, // 10 minutes
  } as const;