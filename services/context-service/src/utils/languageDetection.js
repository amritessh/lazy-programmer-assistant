// services/context-service/src/utils/languageDetection.js
const path = require('path');

class LanguageDetection {
  constructor() {
    // Language patterns and indicators
    this.languageIndicators = {
      javascript: {
        extensions: ['.js', '.mjs'],
        keywords: ['function', 'const', 'let', 'var', '=>', 'require', 'import'],
        patterns: [
          /function\s+\w+\s*\(/,
          /const\s+\w+\s*=/,
          /let\s+\w+\s*=/,
          /require\(['"][\w\-./]+['"]\)/,
          /import\s+.*\s+from\s+['"].*['"]/,
          /=>\s*{/
        ],
        frameworks: {
          'node': ['require(', 'module.exports', 'process.env'],
          'express': ['app.get(', 'app.post(', 'express()'],
          'react': ['React.', 'useState', 'useEffect', 'JSX']
        }
      },
      
      typescript: {
        extensions: ['.ts', '.tsx'],
        keywords: ['interface', 'type', 'enum', 'class', 'implements', 'extends'],
        patterns: [
          /interface\s+\w+/,
          /type\s+\w+\s*=/,
          /enum\s+\w+/,
          /:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*[;,=]/,
          /function\s+\w+\(.*\):\s*\w+/,
          /class\s+\w+\s+(extends|implements)/
        ],
        frameworks: {
          'angular': ['@Component', '@Injectable', '@NgModule'],
          'react': ['React.FC', 'React.Component', 'JSX.Element']
        }
      },
      
      python: {
        extensions: ['.py', '.pyw'],
        keywords: ['def', 'class', 'import', 'from', 'if __name__', 'self'],
        patterns: [
          /def\s+\w+\(/,
          /class\s+\w+[\(:]?/,
          /import\s+\w+/,
          /from\s+\w+\s+import/,
          /if\s+__name__\s*==\s*['"]__main__['"]/,
          /self\.\w+/
        ],
        frameworks: {
          'django': ['from django', 'models.Model', 'HttpResponse'],
          'flask': ['from flask', 'Flask(__name__)', '@app.route'],
          'fastapi': ['from fastapi', 'FastAPI()', '@app.get']
        }
      },
      
      java: {
        extensions: ['.java'],
        keywords: ['public class', 'private', 'protected', 'static', 'final'],
        patterns: [
          /public\s+class\s+\w+/,
          /public\s+static\s+void\s+main/,
          /private\s+\w+\s+\w+/,
          /import\s+[\w.]+;/,
          /@\w+/,
          /System\.out\.print/
        ],
        frameworks: {
          'spring': ['@SpringBootApplication', '@RestController', '@Service'],
          'android': ['Activity', 'onCreate', 'android.']
        }
      },
      
      csharp: {
        extensions: ['.cs'],
        keywords: ['using', 'namespace', 'public class', 'private', 'static'],
        patterns: [
          /using\s+[\w.]+;/,
          /namespace\s+[\w.]+/,
          /public\s+class\s+\w+/,
          /public\s+static\s+void\s+Main/,
          /Console\.WriteLine/,
          /\[[\w\(\)]+\]/
        ],
        frameworks: {
          'asp.net': ['[HttpGet]', '[HttpPost]', 'Controller'],
          'blazor': ['@page', '@inject', 'ComponentBase']
        }
      },
      
      cpp: {
        extensions: ['.cpp', '.cc', '.cxx', '.c++'],
        keywords: ['#include', 'using namespace', 'std::', 'int main'],
        patterns: [
          /#include\s*<[\w.]+>/,
          /#include\s*"[\w.]+"/,
          /using\s+namespace\s+std/,
          /std::\w+/,
          /int\s+main\s*\(/,
          /cout\s*<<|cin\s*>>/
        ]
      },
      
      c: {
        extensions: ['.c', '.h'],
        keywords: ['#include', 'printf', 'scanf', 'int main', 'void'],
        patterns: [
          /#include\s*<[\w.]+>/,
          /int\s+main\s*\(/,
          /printf\s*\(/,
          /scanf\s*\(/,
          /void\s+\w+\s*\(/
        ]
      },
      
      go: {
        extensions: ['.go'],
        keywords: ['package', 'import', 'func', 'var', 'const', 'type'],
        patterns: [
          /package\s+\w+/,
          /import\s*\(/,
          /func\s+\w+\(/,
          /var\s+\w+/,
          /type\s+\w+\s+(struct|interface)/,
          /fmt\.\w+/
        ]
      },
      
      rust: {
        extensions: ['.rs'],
        keywords: ['fn', 'let', 'mut', 'impl', 'struct', 'enum'],
        patterns: [
          /fn\s+\w+\(/,
          /let\s+(mut\s+)?\w+/,
          /impl\s+\w+/,
          /struct\s+\w+/,
          /enum\s+\w+/,
          /println!\(/
        ]
      },
      
      php: {
        extensions: ['.php'],
        keywords: ['<?php', 'function', 'class', '$', 'echo', 'var'],
        patterns: [
          /<\?php/,
          /function\s+\w+\(/,
          /class\s+\w+/,
          /\$\w+/,
          /echo\s+/,
          /->\w+/
        ],
        frameworks: {
          'laravel': ['Illuminate\\', 'Artisan::', 'Route::'],
          'symfony': ['Symfony\\', 'use Symfony']
        }
      },
      
      ruby: {
        extensions: ['.rb'],
        keywords: ['def', 'class', 'module', 'require', 'puts', 'end'],
        patterns: [
          /def\s+\w+/,
          /class\s+\w+/,
          /module\s+\w+/,
          /require\s+['"][\w\/]+['"]/,
          /puts\s+/,
          /@\w+/
        ],
        frameworks: {
          'rails': ['ActiveRecord', 'ActionController', 'Rails.application']
        }
      },
      
      html: {
        extensions: ['.html', '.htm'],
        keywords: ['<!DOCTYPE', '<html>', '<head>', '<body>', '<div>'],
        patterns: [
          /<!DOCTYPE\s+html>/i,
          /<html[^>]*>/i,
          /<head[^>]*>/i,
          /<body[^>]*>/i,
          /<\w+[^>]*>/
        ]
      },
      
      css: {
        extensions: ['.css'],
        keywords: ['{', '}', ':', ';', '@media', 'px', '%'],
        patterns: [
          /[.#]?[\w-]+\s*{/,
          /[\w-]+\s*:\s*[^;]+;/,
          /@media\s*\([^)]+\)/,
          /\d+(px|em|rem|%|vh|vw)/,
          /@import\s+/
        ]
      },
      
      scss: {
        extensions: ['.scss', '.sass'],
        keywords: ['$', '@mixin', '@include', '@extend', '&'],
        patterns: [
          /\$[\w-]+\s*:/,
          /@mixin\s+[\w-]+/,
          /@include\s+[\w-]+/,
          /@extend\s+/,
          /&[\w-]*\s*{/
        ]
      },
      
      json: {
        extensions: ['.json'],
        keywords: ['{', '}', '[', ']', ':', ','],
        patterns: [
          /^\s*{/,
          /^\s*\[/,
          /"[\w-]+"\s*:/,
          /:\s*"[^"]*"/,
          /:\s*\d+/
        ]
      }
    };
  }

  /**
   * Detect language from file extension
   */
  detectByExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [language, config] of Object.entries(this.languageIndicators)) {
      if (config.extensions.includes(ext)) {
        return language;
      }
    }
    
    return null;
  }

  /**
   * Detect language from file content
   */
  detectByContent(content, filePath = null) {
    if (!content || typeof content !== 'string') {
      return null;
    }

    const scores = {};
    const contentLower = content.toLowerCase();
    const contentSample = content.substring(0, 2000); // First 2KB for performance

    // Score each language based on keyword and pattern matches
    for (const [language, config] of Object.entries(this.languageIndicators)) {
      let score = 0;

      // Keyword matching
      for (const keyword of config.keywords) {
        const keywordLower = keyword.toLowerCase();
        const matches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
        score += matches * 2; // Keywords are worth 2 points each
      }

      // Pattern matching
      for (const pattern of config.patterns) {
        const matches = (contentSample.match(pattern) || []).length;
        score += matches * 3; // Patterns are worth 3 points each
      }

      // Bonus for file extension match
      if (filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (config.extensions.includes(ext)) {
          score += 10; // Extension match is worth 10 points
        }
      }

      if (score > 0) {
        scores[language] = score;
      }
    }

    // Return the language with the highest score
    if (Object.keys(scores).length === 0) {
      return null;
    }

    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const [topLanguage, topScore] = sortedScores[0];

    // Only return if confidence is reasonable
    return topScore >= 5 ? topLanguage : null;
  }

  /**
   * Detect framework within a language
   */
  detectFramework(content, language) {
    if (!content || !language || !this.languageIndicators[language]) {
      return null;
    }

    const config = this.languageIndicators[language];
    if (!config.frameworks) {
      return null;
    }

    const contentLower = content.toLowerCase();
    const frameworkScores = {};

    // Score each framework based on indicator matches
    for (const [framework, indicators] of Object.entries(config.frameworks)) {
      let score = 0;

      for (const indicator of indicators) {
        const indicatorLower = indicator.toLowerCase();
        if (contentLower.includes(indicatorLower)) {
          score += 1;
        }
      }

      if (score > 0) {
        frameworkScores[framework] = score;
      }
    }

    if (Object.keys(frameworkScores).length === 0) {
      return null;
    }

    // Return framework with highest score
    const sortedFrameworks = Object.entries(frameworkScores)
      .sort(([,a], [,b]) => b - a);
    
    return sortedFrameworks[0][0];
  }

  /**
   * Analyze multiple files to determine project languages
   */
  analyzeProjectLanguages(files) {
    const languageScores = {};
    const frameworkScores = {};
    const totalFiles = files.length;

    for (const file of files) {
      // Skip certain file types
      if (this.shouldSkipFile(file)) {
        continue;
      }

      // Detect language by extension first
      let language = this.detectByExtension(file.path || file.name);
      
      // If we have content, use content detection
      if (file.content && file.content.trim()) {
        const contentLanguage = this.detectByContent(file.content, file.path || file.name);
        if (contentLanguage) {
          language = contentLanguage; // Content detection overrides extension
        }
      }

      if (language) {
        languageScores[language] = (languageScores[language] || 0) + 1;

        // Detect framework if we have content
        if (file.content) {
          const framework = this.detectFramework(file.content, language);
          if (framework) {
            const key = `${language}:${framework}`;
            frameworkScores[key] = (frameworkScores[key] || 0) + 1;
          }
        }
      }
    }

    // Calculate percentages and determine primary/secondary languages
    const sortedLanguages = Object.entries(languageScores)
      .sort(([,a], [,b]) => b - a)
      .map(([lang, count]) => ({
        language: lang,
        fileCount: count,
        percentage: Math.round((count / totalFiles) * 100)
      }));

    // Determine primary framework
    let primaryFramework = null;
    if (Object.keys(frameworkScores).length > 0) {
      const sortedFrameworks = Object.entries(frameworkScores)
        .sort(([,a], [,b]) => b - a);
      
      const [frameworkKey, count] = sortedFrameworks[0];
      const [language, framework] = frameworkKey.split(':');
      
      // Only consider it primary if it appears in multiple files
      if (count >= 2) {
        primaryFramework = framework;
      }
    }

    return {
      primary: sortedLanguages[0]?.language || null,
      secondary: sortedLanguages.slice(1, 3).map(l => l.language),
      all: sortedLanguages,
      framework: primaryFramework,
      scores: languageScores,
      frameworkScores
    };
  }

  /**
   * Check if file should be skipped in language analysis
   */
  shouldSkipFile(file) {
    const fileName = (file.name || file.path || '').toLowerCase();
    const filePath = (file.path || '').toLowerCase();
    
    // Skip common non-code files
    const skipPatterns = [
      /package-lock\.json$/,
      /yarn\.lock$/,
      /\.min\.(js|css)$/,
      /\.map$/,
      /\.log$/,
      /\.tmp$/,
      /\.cache$/,
      /readme\.(md|txt)$/,
      /license$/,
      /changelog/,
      /\.git/,
      /node_modules/,
      /dist/,
      /build/,
      /coverage/
    ];

    return skipPatterns.some(pattern => 
      pattern.test(fileName) || pattern.test(filePath)
    );
  }

  /**
   * Get confidence score for language detection
   */
  getConfidenceScore(detectedLanguage, file) {
    let confidence = 0.5; // Base confidence

    // Boost confidence for extension match
    if (file.path || file.name) {
      const ext = path.extname(file.path || file.name).toLowerCase();
      const config = this.languageIndicators[detectedLanguage];
      if (config && config.extensions.includes(ext)) {
        confidence += 0.3;
      }
    }

    // Boost confidence if we have content
    if (file.content && file.content.trim()) {
      confidence += 0.2;
      
      // Additional boost for strong content indicators
      const contentLanguage = this.detectByContent(file.content);
      if (contentLanguage === detectedLanguage) {
        confidence += 0.2;
      }
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Detect build tools and package managers
   */
  detectBuildTools(files) {
    const buildTools = {
      packageManagers: [],
      buildSystems: [],
      taskRunners: []
    };

    for (const file of files) {
      const fileName = (file.name || '').toLowerCase();
      
      // Package managers
      if (fileName === 'package.json') buildTools.packageManagers.push('npm');
      if (fileName === 'yarn.lock') buildTools.packageManagers.push('yarn');
      if (fileName === 'pnpm-lock.yaml') buildTools.packageManagers.push('pnpm');
      if (fileName === 'requirements.txt') buildTools.packageManagers.push('pip');
      if (fileName === 'cargo.toml') buildTools.packageManagers.push('cargo');
      if (fileName === 'go.mod') buildTools.packageManagers.push('go modules');
      if (fileName === 'composer.json') buildTools.packageManagers.push('composer');
      if (fileName === 'gemfile') buildTools.packageManagers.push('bundler');

      // Build systems
      if (fileName === 'webpack.config.js') buildTools.buildSystems.push('webpack');
      if (fileName === 'vite.config.js') buildTools.buildSystems.push('vite');
      if (fileName === 'rollup.config.js') buildTools.buildSystems.push('rollup');
      if (fileName === 'parcel.config.js') buildTools.buildSystems.push('parcel');
      if (fileName === 'tsconfig.json') buildTools.buildSystems.push('typescript');
      if (fileName === 'babel.config.js') buildTools.buildSystems.push('babel');
      if (fileName === 'makefile') buildTools.buildSystems.push('make');
      if (fileName === 'cmake.txt') buildTools.buildSystems.push('cmake');
      if (fileName === 'build.gradle') buildTools.buildSystems.push('gradle');
      if (fileName === 'pom.xml') buildTools.buildSystems.push('maven');

      // Task runners
      if (fileName === 'gulpfile.js') buildTools.taskRunners.push('gulp');
      if (fileName === 'gruntfile.js') buildTools.taskRunners.push('grunt');
      if (fileName === 'rakefile') buildTools.taskRunners.push('rake');
      
      // Check package.json scripts
      if (fileName === 'package.json' && file.content) {
        try {
          const pkg = JSON.parse(file.content);
          if (pkg.scripts) {
            const scripts = Object.keys(pkg.scripts);
            if (scripts.includes('build')) buildTools.taskRunners.push('npm scripts');
            if (scripts.some(s => s.includes('webpack'))) buildTools.buildSystems.push('webpack');
            if (scripts.some(s => s.includes('vite'))) buildTools.buildSystems.push('vite');
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }

    // Remove duplicates
    buildTools.packageManagers = [...new Set(buildTools.packageManagers)];
    buildTools.buildSystems = [...new Set(buildTools.buildSystems)];
    buildTools.taskRunners = [...new Set(buildTools.taskRunners)];

    return buildTools;
  }

  /**
   * Detect testing frameworks
   */
  detectTestingFrameworks(files) {
    const testingFrameworks = [];

    for (const file of files) {
      const fileName = (file.name || '').toLowerCase();
      const filePath = (file.path || '').toLowerCase();
      
      // Check for test files
      if (fileName.includes('test') || fileName.includes('spec') || 
          filePath.includes('/test/') || filePath.includes('/tests/') ||
          filePath.includes('/__tests__/')) {
        
        // Analyze content for testing frameworks
        if (file.content) {
          const content = file.content.toLowerCase();
          
          // JavaScript/TypeScript testing frameworks
          if (content.includes('jest') || content.includes('describe(') || content.includes('it(')) {
            testingFrameworks.push('jest');
          }
          if (content.includes('mocha') || content.includes('describe(')) {
            testingFrameworks.push('mocha');
          }
          if (content.includes('jasmine')) {
            testingFrameworks.push('jasmine');
          }
          if (content.includes('cypress')) {
            testingFrameworks.push('cypress');
          }
          if (content.includes('playwright')) {
            testingFrameworks.push('playwright');
          }
          
          // Python testing frameworks
          if (content.includes('pytest') || content.includes('def test_')) {
            testingFrameworks.push('pytest');
          }
          if (content.includes('unittest') || content.includes('TestCase')) {
            testingFrameworks.push('unittest');
          }
          
          // Java testing frameworks
          if (content.includes('junit') || content.includes('@test')) {
            testingFrameworks.push('junit');
          }
          if (content.includes('testng')) {
            testingFrameworks.push('testng');
          }
        }
      }
      
      // Check configuration files
      if (fileName === 'jest.config.js') testingFrameworks.push('jest');
      if (fileName === 'cypress.json') testingFrameworks.push('cypress');
      if (fileName === 'playwright.config.js') testingFrameworks.push('playwright');
      if (fileName === 'pytest.ini') testingFrameworks.push('pytest');
    }

    return [...new Set(testingFrameworks)];
  }

  /**
   * Get language-specific suggestions
   */
  getLanguageSuggestions(language, files) {
    const suggestions = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        if (!files.some(f => f.name === 'package.json')) {
          suggestions.push('Consider adding a package.json file for dependency management');
        }
        if (!files.some(f => f.name.includes('test') || f.name.includes('spec'))) {
          suggestions.push('Add unit tests using Jest or similar testing framework');
        }
        break;
        
      case 'python':
        if (!files.some(f => f.name === 'requirements.txt')) {
          suggestions.push('Consider adding a requirements.txt file for dependency management');
        }
        if (!files.some(f => f.name === 'setup.py' || f.name === 'pyproject.toml')) {
          suggestions.push('Add setup.py or pyproject.toml for package configuration');
        }
        break;
        
      case 'java':
        if (!files.some(f => f.name === 'pom.xml' || f.name === 'build.gradle')) {
          suggestions.push('Consider using Maven (pom.xml) or Gradle (build.gradle) for build management');
        }
        break;
        
      case 'csharp':
        if (!files.some(f => f.name.endsWith('.csproj') || f.name.endsWith('.sln'))) {
          suggestions.push('Consider adding project files (.csproj) or solution files (.sln)');
        }
        break;
    }
    
    return suggestions;
  }
}

module.exports = new LanguageDetection();