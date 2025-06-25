// shared/src/types/api.ts

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  // Chat related types
  export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
      timestamp: string;
      assumptions?: string[];
      codeGenerated?: boolean;
      context?: any;
    };
    createdAt: string;
  }
  
  export interface ChatSession {
    id: string;
    userId: string;
    projectId?: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface VagueRequest {
    text: string;
    context?: ProjectContext;
    sessionId: string;
  }
  
  export interface CodeGenerationRequest {
    vagueDescription: string;
    context: ProjectContext;
    assumptions: string[];
    preferences?: UserPreferences;
  }
  
  export interface CodeGenerationResponse {
    code: string;
    explanation: string;
    assumptions: string[];
    confidence: number;
    alternatives?: {
      code: string;
      description: string;
    }[];
  }
  
  // Project related types
  export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    projectPath?: string;
    language: string;
    framework?: string;
    contextData?: ProjectContextData;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ProjectContext {
    projectId: string;
    currentFiles: FileInfo[];
    recentChanges: GitChange[];
    dependencies: ProjectDependency[];
    projectType: ProjectType;
    focusArea?: string;
  }
  
  export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    size: number;
    lastModified: string;
    content?: string;
    isCurrentlyOpen?: boolean;
  }
  
  export interface GitChange {
    file: string;
    type: 'added' | 'modified' | 'deleted';
    timestamp: string;
    commit?: string;
  }
  
  export interface ProjectDependency {
    name: string;
    version: string;
    type: 'dependency' | 'devDependency';
  }
  
  export type ProjectType = 
    | 'react'
    | 'vue'
    | 'angular'
    | 'node'
    | 'python'
    | 'nextjs'
    | 'express'
    | 'fastapi'
    | 'unknown';
  
  export interface ProjectContextData {
    structure: FileInfo[];
    dependencies: ProjectDependency[];
    gitHistory: GitChange[];
    language: string;
    framework?: string;
    buildTool?: string;
    packageManager?: string;
  }
  
  // User related types
  export interface UserProfile {
    id: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UserPreferences {
    id: string;
    userId: string;
    preferenceType: string;
    preferenceData: {
      codingStyle?: {
        indentation: 'tabs' | 'spaces';
        semicolons: boolean;
        quotes: 'single' | 'double';
        trailingCommas: boolean;
      };
      aiPersonality?: {
        sassLevel: number; // 1-10
        verbosity: 'brief' | 'detailed' | 'verbose';
        explanationStyle: 'technical' | 'casual' | 'educational';
      };
      commonPatterns?: {
        phrase: string;
        interpretation: string;
        confidence: number;
      }[];
    };
    createdAt: string;
    updatedAt: string;
  }
  
  // Service communication types
  export interface ServiceRequest<T = any> {
    id: string;
    service: string;
    method: string;
    data: T;
    timestamp: string;
  }
  
  export interface ServiceResponse<T = any> {
    id: string;
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
  }
  
  // Context service types
  export interface ContextAnalysisRequest {
    projectPath?: string;
    files?: FileInfo[];
    focusFiles?: string[];
  }
  
  export interface ContextAnalysisResponse {
    context: ProjectContext;
    summary: string;
    relevantFiles: FileInfo[];
    suggestions: string[];
  }
  
  // AI service types
  export interface VagueParseRequest {
    text: string;
    context?: ProjectContext;
    userPreferences?: UserPreferences;
  }
  
  export interface VagueParseResponse {
    interpretation: string;
    assumptions: string[];
    confidence: number;
    suggestedActions: string[];
    needsMoreInfo: boolean;
    clarifyingQuestions?: string[];
  }
  
  // Learning service types
  export interface LearningEvent {
    userId: string;
    eventType: 'successful_interpretation' | 'failed_interpretation' | 'user_correction' | 'code_accepted' | 'code_rejected';
    data: {
      originalRequest?: string;
      interpretation?: string;
      userFeedback?: string;
      context?: any;
    };
    timestamp: string;
  }
  
  export interface PatternLearning {
    pattern: string;
    interpretations: {
      text: string;
      confidence: number;
      successRate: number;
    }[];
    contexts: string[];
    userId: string;
  }
  
  // File service types
  export interface FileUploadRequest {
    files: File[] | FileInfo[];
    projectId?: string;
    extractContext?: boolean;
  }
  
  export interface FileUploadResponse {
    uploadedFiles: FileInfo[];
    extractedContext?: ProjectContext;
    errors?: string[];
  }