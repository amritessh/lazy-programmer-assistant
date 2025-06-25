const path = require('path');
const {
  SUPPORTED_LANGUAGES,
  FRAMEWORKS,
  FILE_EXTENSIONS
} = require('@lpa/shared');
const languageDetection = require('../utils/languageDetection');

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

    // Requirements.txt analysis (Python)
    if (fileName === 'requirements.txt' && file.content) {
      const lines = file.content.split('\n');
      lines.forEach(line => {
        const dep = line.trim().toLowerCase();
        if (dep.includes('django'))
          indicators.django = (indicators.django || 0) + 8;
        if (dep.includes('flask'))
          indicators.flask = (indicators.flask || 0) + 8;
        if (dep.includes('fastapi'))
          indicators.fastapi = (indicators.fastapi || 0) + 8;
      });
    }

    // File structure indicators
    if (fileName === 'next.config.js')
      indicators.nextjs = (indicators.nextjs || 0) + 8;
    if (fileName === 'angular.json')
      indicators.angular = (indicators.angular || 0) + 8;
    if (fileName === 'vue.config.js')
      indicators.vue = (indicators.vue || 0) + 8;
    if (fileName === 'svelte.config.js')
      indicators.svelte = (indicators.svelte || 0) + 8;
    if (fileName === 'nuxt.config.js')
      indicators.nuxtjs = (indicators.nuxtjs || 0) + 8;

    // Directory structure indicators
    if (filePath.includes('/src/components/'))
      indicators.react = (indicators.react || 0) + 2;
    if (filePath.includes('/pages/'))
      indicators.nextjs = (indicators.nextjs || 0) + 2;
    if (filePath.includes('/app/'))
      indicators.rails = (indicators.rails || 0) + 2;

    // File content indicators (if available)
    if (file.content) {
      const content = file.content.toLowerCase();
      if (content.includes('import react'))
        indicators.react = (indicators.react || 0) + 3;
      if (content.includes('from django'))
        indicators.django = (indicators.django || 0) + 3;
      if (content.includes('from flask'))
        indicators.flask = (indicators.flask || 0) + 3;
      if (content.includes('express()'))
        indicators.express = (indicators.express || 0) + 3;
    }
  }

  /**
   * Determine the most likely framework
   */
  determineFramework(indicators, primaryLanguage) {
    if (Object.keys(indicators).length === 0) return null;

    // Sort by score and return the highest
    const sorted = Object.entries(indicators).sort(([, a], [, b]) => b - a);

    if (sorted.length === 0) return null;

    const [topFramework, topScore] = sorted[0];

    // Confidence threshold
    if (topScore < 3) return null;

    return topFramework;
  }

  /**
   * Analyze dependencies from package files
   */
  analyzeDependencies(files) {
    const dependencies = [];

    files.forEach(file => {
      const fileName = file.name.toLowerCase();

      // Node.js dependencies
      if (fileName === 'package.json' && file.content) {
        try {
          const pkg = JSON.parse(file.content);

          // Add production dependencies
          if (pkg.dependencies) {
            Object.entries(pkg.dependencies).forEach(([name, version]) => {
              dependencies.push({
                name,
                version,
                type: 'dependency',
                source: 'package.json'
              });
            });
          }

          // Add dev dependencies
          if (pkg.devDependencies) {
            Object.entries(pkg.devDependencies).forEach(([name, version]) => {
              dependencies.push({
                name,
                version,
                type: 'devDependency',
                source: 'package.json'
              });
            });
          }
        } catch (e) {
          // Invalid JSON
        }
      }

      // Python dependencies
      if (fileName === 'requirements.txt' && file.content) {
        const lines = file.content.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [name, version] = trimmed.split(/[>=<]/);
            dependencies.push({
              name: name.trim(),
              version: version || 'latest',
              type: 'dependency',
              source: 'requirements.txt'
            });
          }
        });
      }

      // Other dependency files could be added here
      // (Cargo.toml, pom.xml, composer.json, etc.)
    });

    return dependencies;
  }

  /**
   * Detect project type based on files and dependencies
   */
  detectProjectType(files, dependencies) {
    const indicators = {};

    // File-based detection
    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      const ext = path.extname(fileName);

      if (fileName.includes('component') || fileName.includes('page')) {
        indicators.frontend = (indicators.frontend || 0) + 2;
      }

      if (
        fileName.includes('api') ||
        fileName.includes('route') ||
        fileName.includes('controller')
      ) {
        indicators.backend = (indicators.backend || 0) + 2;
      }

      if (fileName.includes('test') || fileName.includes('spec')) {
        indicators.testing = (indicators.testing || 0) + 1;
      }

      if (ext === '.html' || ext === '.css') {
        indicators.frontend = (indicators.frontend || 0) + 1;
      }

      if (fileName === 'dockerfile' || fileName === 'docker-compose.yml') {
        indicators.containerized = (indicators.containerized || 0) + 3;
      }
    });

    // Dependency-based detection
    dependencies.forEach(dep => {
      const name = dep.name.toLowerCase();

      if (['react', 'vue', 'angular', 'svelte'].some(fw => name.includes(fw))) {
        indicators.frontend = (indicators.frontend || 0) + 3;
      }

      if (
        ['express', 'fastapi', 'django', 'flask', 'spring'].some(fw =>
          name.includes(fw)
        )
      ) {
        indicators.backend = (indicators.backend || 0) + 3;
      }

      if (
        ['jest', 'mocha', 'pytest', 'junit'].some(test => name.includes(test))
      ) {
        indicators.testing = (indicators.testing || 0) + 2;
      }
    });

    // Determine primary type
    const sorted = Object.entries(indicators).sort(([, a], [, b]) => b - a);

    if (sorted.length === 0) return 'unknown';

    const [primaryType] = sorted[0];

    // Check for full-stack
    if (
      indicators.frontend &&
      indicators.backend &&
      Math.abs(indicators.frontend - indicators.backend) < 3
    ) {
      return 'fullstack';
    }

    return primaryType;
  }

  /**
   * Detect focus area based on recent modifications
   */
  detectFocusArea(files) {
    // Sort files by last modified (most recent first)
    const recentFiles = files
      .filter(f => f.lastModified)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 10); // Top 10 most recent

    if (recentFiles.length === 0) return null;

    // Analyze common directories in recent files
    const recentDirs = recentFiles.map(f => path.dirname(f.path));
    const dirCounts = {};

    recentDirs.forEach(dir => {
      // Count each directory level
      const parts = dir.split(path.sep);
      for (let i = 0; i < parts.length; i++) {
        const partialPath = parts.slice(0, i + 1).join(path.sep);
        dirCounts[partialPath] = (dirCounts[partialPath] || 0) + 1;
      }
    });

    // Find most common directory
    const sortedDirs = Object.entries(dirCounts).sort(([, a], [, b]) => b - a);

    if (sortedDirs.length === 0) return null;

    const [focusDir, count] = sortedDirs[0];

    return {
      directory: focusDir,
      confidence: count / recentFiles.length,
      recentFiles: recentFiles.slice(0, 5).map(f => f.path)
    };
  }

  /**
   * Rank files by relevance for code generation
   */
  rankFileRelevance(files, focusArea) {
    return files
      .map(file => {
        let score = 0;
        const fileName = file.name.toLowerCase();
        const filePath = file.path.toLowerCase();

        // Boost score for recently modified files
        if (file.lastModified) {
          const daysSince =
            (Date.now() - new Date(file.lastModified)) / (1000 * 60 * 60 * 24);
          if (daysSince < 1) score += 10;
          else if (daysSince < 7) score += 5;
          else if (daysSince < 30) score += 2;
        }

        // Boost score for files in focus area
        if (focusArea && filePath.includes(focusArea.directory.toLowerCase())) {
          score += 8;
        }

        // Boost score for important file types
        if (fileName.includes('component') || fileName.includes('page'))
          score += 5;
        if (fileName.includes('api') || fileName.includes('route')) score += 5;
        if (fileName.includes('util') || fileName.includes('helper'))
          score += 3;
        if (fileName.includes('config')) score += 2;
        if (fileName.includes('test') || fileName.includes('spec')) score += 1;

        // Boost score for common important files
        if (['index', 'main', 'app'].some(name => fileName.includes(name)))
          score += 3;

        // Reduce score for generated/build files
        if (
          filePath.includes('node_modules') ||
          filePath.includes('dist') ||
          filePath.includes('build') ||
          filePath.includes('.git')
        ) {
          score -= 20;
        }

        return {
          ...file,
          relevanceScore: Math.max(0, score)
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate project summary
   */
  generateSummary(fileAnalysis, languageInfo, projectType) {
    const { primary, framework } = languageInfo;
    const { totalFiles, fileTypes } = fileAnalysis;

    let summary = `This appears to be a ${primary || 'unknown'} project`;

    if (framework) {
      summary += ` using ${framework}`;
    }

    summary += `. The project contains ${totalFiles} files`;

    const mainTypes = Object.entries(fileTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([ext, count]) => `${count} ${ext} files`)
      .join(', ');

    if (mainTypes) {
      summary += ` with ${mainTypes}`;
    }

    if (projectType && projectType !== 'unknown') {
      summary += `. This looks like a ${projectType} application`;
    }

    return summary + '.';
  }

  /**
   * Generate suggestions for improvement
   */
  generateSuggestions(fileAnalysis, languageInfo, projectType) {
    const suggestions = [];

    // Framework-specific suggestions
    if (languageInfo.framework === 'react') {
      if (!fileAnalysis.structure.src) {
        suggestions.push(
          'Consider organizing your React components in a src/ directory'
        );
      }
      if (
        !fileAnalysis.structure.components &&
        !(
          fileAnalysis.structure.src &&
          fileAnalysis.structure.src.subdirs &&
          fileAnalysis.structure.src.subdirs.components
        )
      ) {
        suggestions.push(
          'Create a components/ directory to organize your React components'
        );
      }
    }

    // General project structure suggestions
    if (fileAnalysis.totalFiles > 20 && fileAnalysis.depth < 2) {
      suggestions.push(
        'Consider organizing your files into subdirectories for better structure'
      );
    }

    // Testing suggestions
    const hasTestFiles = Object.keys(fileAnalysis.fileTypes).some(ext =>
      ['.test.js', '.spec.js', '.test.ts', '.spec.ts'].includes(ext)
    );

    if (!hasTestFiles && fileAnalysis.totalFiles > 5) {
      suggestions.push('Consider adding unit tests to improve code quality');
    }

    // Documentation suggestions
    const hasReadme = Object.values(fileAnalysis.structure).some(
      dir =>
        dir.files &&
        dir.files.some(f => f.name.toLowerCase().includes('readme'))
    );

    if (!hasReadme) {
      suggestions.push('Add a README.md file to document your project');
    }

    return suggestions;
  }

  /**
   * Calculate confidence score for the analysis
   */
  calculateConfidence(files, languageInfo) {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on number of files
    if (files.length > 10) confidence += 0.2;
    if (files.length > 50) confidence += 0.1;

    // Boost confidence if we detected a clear primary language
    if (languageInfo.primary !== 'unknown') confidence += 0.2;

    // Boost confidence if we detected a framework
    if (languageInfo.framework) confidence += 0.1;

    // Boost confidence if we have file content
    const filesWithContent = files.filter(f => f.content).length;
    if (filesWithContent > files.length * 0.5) confidence += 0.1;

    return Math.min(1.0, confidence);
  }
}

module.exports = new ContextEngine();
