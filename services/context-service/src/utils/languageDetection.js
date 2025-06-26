// services/context-service/src/utils/languageDetection.js
import path from 'path';

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
   * Detect language by file extension
   */
  detectByExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [language, config] of Object.entries(this.languageIndicators)) {
      if (config.extensions.includes(ext)) {
        return language;
      }
    }
    
    return 'unknown';
  }

  /**
   * Detect language by file content
   */
  detectByContent(content, filePath = null) {
    if (!content || typeof content !== 'string') {
      return filePath ? this.detectByExtension(filePath) : 'unknown';
    }

    const scores = {};
    const contentLower = content.toLowerCase();

    // Score each language based on patterns and keywords
    for (const [language, config] of Object.entries(this.languageIndicators)) {
      let score = 0;

      // Check keywords
      for (const keyword of config.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // Check patterns
      for (const pattern of config.patterns) {
        if (pattern.test(content)) {
          score += 2;
        }
      }

      if (score > 0) {
        scores[language] = score;
      }
    }

    // Return the language with the highest score
    if (Object.keys(scores).length === 0) {
      return filePath ? this.detectByExtension(filePath) : 'unknown';
    }

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted[0][0];
  }

  /**
   * Detect framework used in the code
   */
  detectFramework(content, language) {
    if (!content || !language || !this.languageIndicators[language]) {
      return null;
    }

    const config = this.languageIndicators[language];
    const frameworks = config.frameworks || {};
    const contentLower = content.toLowerCase();

    for (const [framework, indicators] of Object.entries(frameworks)) {
      for (const indicator of indicators) {
        if (contentLower.includes(indicator.toLowerCase())) {
          return framework;
        }
      }
    }

    return null;
  }

  /**
   * Analyze languages used in a project
   */
  analyzeProjectLanguages(files) {
    const languageStats = {};
    const frameworkStats = {};

    files.forEach(file => {
      if (this.shouldSkipFile(file)) {
        return;
      }

      // Detect language
      let language = 'unknown';
      if (file.content) {
        language = this.detectByContent(file.content, file.path);
      } else {
        language = this.detectByExtension(file.path);
      }

      // Count language usage
      languageStats[language] = (languageStats[language] || 0) + 1;

      // Detect framework if we have content
      if (file.content && language !== 'unknown') {
        const framework = this.detectFramework(file.content, language);
        if (framework) {
          frameworkStats[framework] = (frameworkStats[framework] || 0) + 1;
        }
      }
    });

    // Sort by usage
    const sortedLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .map(([lang, count]) => ({ language: lang, count }));

    const sortedFrameworks = Object.entries(frameworkStats)
      .sort(([, a], [, b]) => b - a)
      .map(([framework, count]) => ({ framework, count }));

    return {
      languages: sortedLanguages,
      frameworks: sortedFrameworks,
      primaryLanguage: sortedLanguages[0]?.language || 'unknown',
      primaryFramework: sortedFrameworks[0]?.framework || null
    };
  }

  /**
   * Check if file should be skipped in analysis
   */
  shouldSkipFile(file) {
    const skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '*.min.js',
      '*.min.css',
      'package-lock.json',
      'yarn.lock'
    ];

    return skipPatterns.some(pattern => 
      file.path.includes(pattern) || file.name.includes(pattern)
    );
  }

  /**
   * Get confidence score for language detection
   */
  getConfidenceScore(detectedLanguage, file) {
    if (detectedLanguage === 'unknown') {
      return 0;
    }

    let score = 0.5; // Base score

    // Boost score if extension matches
    const extensionLanguage = this.detectByExtension(file.path);
    if (extensionLanguage === detectedLanguage) {
      score += 0.3;
    }

    // Boost score if we have content
    if (file.content) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect build tools used in the project
   */
  detectBuildTools(files) {
    const buildTools = [];

    const toolIndicators = {
      'webpack': ['webpack.config.js', 'webpack.config.ts'],
      'vite': ['vite.config.js', 'vite.config.ts'],
      'rollup': ['rollup.config.js', 'rollup.config.ts'],
      'parcel': ['.parcelrc', 'parcel.config.js'],
      'gulp': ['gulpfile.js', 'gulpfile.ts'],
      'grunt': ['Gruntfile.js', 'Gruntfile.ts'],
      'make': ['Makefile'],
      'cmake': ['CMakeLists.txt'],
      'maven': ['pom.xml'],
      'gradle': ['build.gradle', 'build.gradle.kts'],
      'cargo': ['Cargo.toml'],
      'npm': ['package.json'],
      'yarn': ['yarn.lock', 'package.json'],
      'pip': ['requirements.txt', 'setup.py'],
      'poetry': ['pyproject.toml'],
      'composer': ['composer.json']
    };

    for (const [tool, indicators] of Object.entries(toolIndicators)) {
      for (const indicator of indicators) {
        if (files.some(f => f.name === indicator)) {
          buildTools.push(tool);
          break;
        }
      }
    }

    return buildTools;
  }

  /**
   * Detect testing frameworks used in the project
   */
  detectTestingFrameworks(files) {
    const testingFrameworks = [];

    const frameworkIndicators = {
      'jest': ['jest.config.js', 'jest.config.ts', '.jestrc'],
      'mocha': ['mocha.opts', '.mocharc.js', '.mocharc.json'],
      'cypress': ['cypress.json', 'cypress.config.js'],
      'playwright': ['playwright.config.js', 'playwright.config.ts'],
      'selenium': ['selenium.config.js'],
      'pytest': ['pytest.ini', 'conftest.py'],
      'unittest': ['test_*.py'],
      'junit': ['pom.xml', 'build.gradle'],
      'rspec': ['spec_helper.rb', '.rspec'],
      'minitest': ['test_*.rb']
    };

    for (const [framework, indicators] of Object.entries(frameworkIndicators)) {
      for (const indicator of indicators) {
        if (files.some(f => f.name === indicator || f.name.includes(indicator))) {
          testingFrameworks.push(framework);
          break;
        }
      }
    }

    return testingFrameworks;
  }

  /**
   * Get language-specific suggestions
   */
  getLanguageSuggestions(language, files) {
    const suggestions = [];

    switch (language) {
      case 'javascript':
        if (!files.some(f => f.name === 'package.json')) {
          suggestions.push('Consider adding a package.json file for dependency management');
        }
        if (!files.some(f => f.name.includes('test'))) {
          suggestions.push('Consider adding unit tests (Jest, Mocha, etc.)');
        }
        break;

      case 'typescript':
        if (!files.some(f => f.name === 'tsconfig.json')) {
          suggestions.push('Consider adding a tsconfig.json file for TypeScript configuration');
        }
        break;

      case 'python':
        if (!files.some(f => f.name === 'requirements.txt')) {
          suggestions.push('Consider adding a requirements.txt file for dependency management');
        }
        break;

      case 'java':
        if (!files.some(f => f.name === 'pom.xml') && !files.some(f => f.name === 'build.gradle')) {
          suggestions.push('Consider adding a build tool (Maven or Gradle)');
        }
        break;
    }

    return suggestions;
  }
}

export default new LanguageDetection();