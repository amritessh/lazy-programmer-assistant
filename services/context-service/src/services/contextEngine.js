import path from 'path';
import {
  SUPPORTED_LANGUAGES,
  FRAMEWORKS,
  FILE_EXTENSIONS
} from '@lpa/shared';
import languageDetection from '../utils/languageDetection.js';

class ContextEngine {
  /**
   * Analyze files and generate project context
   */
  async analyzeFiles(files) {
    try {
      // Basic file analysis
      const fileAnalysis = this.analyzeFileStructure(files);

      // Language and framework detection
      const languageInfo = this.detectLanguageAndFramework(files);

      // Dependency analysis
      const dependencies = this.analyzeDependencies(files);

      // Project type detection
      const projectType = this.detectProjectType(files, dependencies);

      // Focus area detection (recently modified files)
      const focusArea = this.detectFocusArea(files);

      // Generate relevance scores for files
      const relevantFiles = this.rankFileRelevance(files, focusArea);

      // Generate summary and suggestions
      const summary = this.generateSummary(
        fileAnalysis,
        languageInfo,
        projectType
      );
      const suggestions = this.generateSuggestions(
        fileAnalysis,
        languageInfo,
        projectType
      );

      return {
        // Core context data
        primaryLanguage: languageInfo.primary,
        secondaryLanguages: languageInfo.secondary,
        framework: languageInfo.framework,
        projectType,
        dependencies,

        // File structure
        totalFiles: files.length,
        fileTypes: fileAnalysis.fileTypes,
        structure: fileAnalysis.structure,

        // Focus and relevance
        focusArea,
        relevantFiles: relevantFiles.slice(0, 20), // Top 20 most relevant

        // Analysis results
        summary,
        suggestions,

        // Metadata
        analyzedAt: new Date().toISOString(),
        confidence: this.calculateConfidence(files, languageInfo)
      };
    } catch (error) {
      console.error('Error in context analysis:', error);
      throw new Error('Failed to analyze project context');
    }
  }

  /**
   * Generate project context from various sources
   */
  async generateProjectContext({ projectStructure, gitContext, userId, projectId }) {
    try {
      // For now, return a mock context since we don't have the full implementation
      return {
        projectId,
        userId,
        structure: projectStructure || {},
        gitContext: gitContext || {},
        primaryLanguage: 'javascript',
        framework: 'react',
        projectType: 'web-application',
        dependencies: ['react', 'express', 'supabase'],
        totalFiles: 150,
        analyzedAt: new Date().toISOString(),
        confidence: 0.8
      };
    } catch (error) {
      console.error('Error generating project context:', error);
      throw new Error('Failed to generate project context');
    }
  }

  /**
   * Analyze file structure and organization
   */
  analyzeFileStructure(files) {
    const fileTypes = {};
    const directories = new Set();
    const structure = {};

    files.forEach(file => {
      // Count file types
      const ext = path.extname(file.name).toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;

      // Build directory structure
      const dir = path.dirname(file.path);
      if (dir !== '.') {
        directories.add(dir);

        // Build nested structure
        const parts = dir.split(path.sep);
        let current = structure;
        parts.forEach(part => {
          if (!current[part]) {
            current[part] = { files: [], subdirs: {} };
          }
          current = current[part].subdirs;
        });
      }

      // Add file to structure
      const dirParts = path.dirname(file.path).split(path.sep);
      let current = structure;
      dirParts.forEach(part => {
        if (part !== '.') {
          current = current[part].subdirs;
        }
      });

      if (!current.files) current.files = [];
      current.files.push(file);
    });

    return {
      fileTypes,
      directories: Array.from(directories),
      structure,
      depth: Math.max(
        ...Array.from(directories).map(d => d.split(path.sep).length),
        1
      )
    };
  }

  /**
   * Detect primary language and framework
   */
  detectLanguageAndFramework(files) {
    const languageScores = {};
    const frameworkIndicators = {};

    files.forEach(file => {
      const ext = path.extname(file.name).toLowerCase();

      // Language detection based on file extensions
      Object.entries(FILE_EXTENSIONS).forEach(([lang, extensions]) => {
        if (extensions.includes(ext)) {
          languageScores[lang] = (languageScores[lang] || 0) + 1;
        }
      });

      // Framework detection based on file names and content
      this.detectFrameworkIndicators(file, frameworkIndicators);
    });

    // Determine primary and secondary languages
    const sortedLanguages = Object.entries(languageScores)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);

    const primary = sortedLanguages[0] || 'unknown';
    const secondary = sortedLanguages.slice(1, 3);

    // Determine framework
    const framework = this.determineFramework(frameworkIndicators, primary);

    return {
      primary,
      secondary,
      framework,
      scores: languageScores,
      frameworkIndicators
    };
  }

  /**
   * Detect framework indicators from files
   */
  detectFrameworkIndicators(file, indicators) {
    const fileName = file.name.toLowerCase();
    const filePath = file.path.toLowerCase();

    // Package.json analysis
    if (fileName === 'package.json' && file.content) {
      try {
        const pkg = JSON.parse(file.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        // React indicators
        if (deps.react) indicators.react = (indicators.react || 0) + 10;
        if (deps.next) indicators.nextjs = (indicators.nextjs || 0) + 10;
        if (deps['@angular/core'])
          indicators.angular = (indicators.angular || 0) + 10;
        if (deps.vue) indicators.vue = (indicators.vue || 0) + 10;
        if (deps.svelte) indicators.svelte = (indicators.svelte || 0) + 10;
        if (deps.express) indicators.express = (indicators.express || 0) + 10;
        if (deps.fastapi) indicators.fastapi = (indicators.fastapi || 0) + 10;
        if (deps.django) indicators.django = (indicators.django || 0) + 10;

        // Additional React ecosystem
        if (deps['react-dom']) indicators.react = (indicators.react || 0) + 5;
        if (deps['react-router'])
          indicators.react = (indicators.react || 0) + 3;
        if (deps.redux) indicators.react = (indicators.react || 0) + 3;
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // File name based detection
    if (fileName.includes('app.js') || fileName.includes('app.ts')) {
      indicators.express = (indicators.express || 0) + 5;
    }
    if (fileName.includes('index.js') || fileName.includes('index.ts')) {
      indicators.react = (indicators.react || 0) + 3;
    }
    if (fileName.includes('main.py')) {
      indicators.fastapi = (indicators.fastapi || 0) + 5;
    }
  }

  /**
   * Determine the primary framework based on indicators
   */
  determineFramework(indicators, primaryLanguage) {
    const sortedFrameworks = Object.entries(indicators)
      .sort(([, a], [, b]) => b - a)
      .map(([framework]) => framework);

    return sortedFrameworks[0] || 'none';
  }

  /**
   * Analyze dependencies from package files
   */
  analyzeDependencies(files) {
    const dependencies = {
      production: [],
      development: [],
      total: 0
    };

    files.forEach(file => {
      if (file.name === 'package.json' && file.content) {
        try {
          const pkg = JSON.parse(file.content);
          const deps = pkg.dependencies || {};
          const devDeps = pkg.devDependencies || {};

          dependencies.production = Object.keys(deps);
          dependencies.development = Object.keys(devDeps);
          dependencies.total = dependencies.production.length + dependencies.development.length;
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    });

    return dependencies;
  }

  /**
   * Detect project type based on files and dependencies
   */
  detectProjectType(files, dependencies) {
    const hasFrontend = files.some(f => 
      f.name.includes('.jsx') || 
      f.name.includes('.tsx') || 
      f.name.includes('.vue') ||
      f.name.includes('.svelte')
    );

    const hasBackend = files.some(f => 
      f.name.includes('server') || 
      f.name.includes('api') || 
      f.name.includes('routes') ||
      dependencies.production.includes('express') ||
      dependencies.production.includes('fastapi')
    );

    const hasDatabase = files.some(f => 
      f.name.includes('schema') || 
      f.name.includes('migration') ||
      dependencies.production.includes('prisma') ||
      dependencies.production.includes('mongoose')
    );

    if (hasFrontend && hasBackend) {
      return 'full-stack';
    } else if (hasFrontend) {
      return 'frontend';
    } else if (hasBackend) {
      return 'backend';
    } else if (hasDatabase) {
      return 'database';
    } else {
      return 'utility';
    }
  }

  /**
   * Detect focus area based on recently modified files
   */
  detectFocusArea(files) {
    // Sort files by modification time (most recent first)
    const recentFiles = files
      .filter(f => f.modifiedAt)
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
      .slice(0, 10);

    const directories = new Set();
    recentFiles.forEach(file => {
      const dir = path.dirname(file.path);
      if (dir !== '.') {
        directories.add(dir);
      }
    });

    return {
      recentFiles,
      activeDirectories: Array.from(directories),
      primaryFocus: recentFiles[0]?.path || 'unknown'
    };
  }

  /**
   * Rank files by relevance to current focus
   */
  rankFileRelevance(files, focusArea) {
    return files.map(file => {
      let score = 0;

      // Boost recently modified files
      if (focusArea.recentFiles.some(f => f.path === file.path)) {
        score += 10;
      }

      // Boost files in active directories
      const fileDir = path.dirname(file.path);
      if (focusArea.activeDirectories.includes(fileDir)) {
        score += 5;
      }

      // Boost configuration files
      if (file.name.includes('config') || file.name.includes('package')) {
        score += 3;
      }

      // Boost main entry points
      if (file.name.includes('index') || file.name.includes('main')) {
        score += 2;
      }

      return {
        ...file,
        relevanceScore: score
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate project summary
   */
  generateSummary(fileAnalysis, languageInfo, projectType) {
    return `This is a ${projectType} project primarily written in ${languageInfo.primary}${languageInfo.framework !== 'none' ? ` using ${languageInfo.framework}` : ''}. The project contains ${fileAnalysis.totalFiles} files across ${fileAnalysis.directories.length} directories.`;
  }

  /**
   * Generate suggestions based on analysis
   */
  generateSuggestions(fileAnalysis, languageInfo, projectType) {
    const suggestions = [];

    if (fileAnalysis.depth > 5) {
      suggestions.push('Consider flattening the directory structure for better maintainability');
    }

    if (languageInfo.secondary.length > 2) {
      suggestions.push('Consider consolidating to fewer languages for better consistency');
    }

    if (projectType === 'full-stack' && !languageInfo.framework) {
      suggestions.push('Consider using a framework for better development experience');
    }

    return suggestions;
  }

  /**
   * Calculate confidence in analysis
   */
  calculateConfidence(files, languageInfo) {
    let confidence = 0.5; // Base confidence

    // More files = higher confidence
    if (files.length > 50) confidence += 0.2;
    if (files.length > 100) confidence += 0.1;

    // Clear language dominance = higher confidence
    const totalFiles = files.length;
    const primaryCount = languageInfo.scores[languageInfo.primary] || 0;
    const primaryRatio = primaryCount / totalFiles;
    
    if (primaryRatio > 0.8) confidence += 0.2;
    else if (primaryRatio > 0.6) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}

export default new ContextEngine();
