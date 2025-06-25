const contextEngine = require('../services/contextEngine');
const fileScanner = require('../services/fileScanner');

describe('Context Engine', () => {
  // Mock files for testing
  const mockReactProject = [
    {
      path: 'src/App.js',
      name: 'App.js',
      extension: '.js',
      size: 1024,
      lastModified: new Date().toISOString(),
      content: `
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello World</h1>
      </header>
    </div>
  );
}

export default App;
      `
    },
    {
      path: 'package.json',
      name: 'package.json',
      extension: '.json',
      size: 512,
      lastModified: new Date().toISOString(),
      content: JSON.stringify(
        {
          name: 'test-react-app',
          version: '1.0.0',
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0'
          },
          devDependencies: {
            '@testing-library/react': '^13.0.0'
          }
        },
        null,
        2
      )
    },
    {
      path: 'src/components/Button.js',
      name: 'Button.js',
      extension: '.js',
      size: 256,
      lastModified: new Date().toISOString(),
      content: `
import React from 'react';

const Button = ({ onClick, children }) => {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
      `
    }
  ];

  describe('analyzeFiles', () => {
    test('should correctly analyze React project', async () => {
      const result = await contextEngine.analyzeFiles(mockReactProject);

      expect(result).toMatchObject({
        primaryLanguage: 'javascript',
        framework: 'react',
        projectType: 'frontend',
        totalFiles: 3
      });

      expect(result.dependencies).toContainEqual({
        name: 'react',
        version: '^18.0.0',
        type: 'dependency',
        source: 'package.json'
      });

      expect(result.summary).toContain('javascript');
      expect(result.summary).toContain('react');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should rank files by relevance', async () => {
      const result = await contextEngine.analyzeFiles(mockReactProject);

      expect(result.relevantFiles).toBeDefined();
      expect(result.relevantFiles.length).toBeGreaterThan(0);

      // Most relevant files should be components
      const topFile = result.relevantFiles[0];
      expect(topFile.relevanceScore).toBeGreaterThan(0);
    });

    test('should generate helpful suggestions', async () => {
      const result = await contextEngine.analyzeFiles(mockReactProject);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('file structure analysis', () => {
    test('should analyze file structure correctly', () => {
      const analysis = contextEngine.analyzeFileStructure(mockReactProject);

      expect(analysis.fileTypes).toEqual({
        '.js': 2,
        '.json': 1
      });

      expect(analysis.directories).toContain('src');
      expect(analysis.directories).toContain('src/components');
    });
  });

  describe('language detection', () => {
    test('should detect JavaScript as primary language', () => {
      const result = contextEngine.detectLanguageAndFramework(mockReactProject);

      expect(result.primary).toBe('javascript');
      expect(result.framework).toBe('react');
      expect(result.scores.javascript).toBe(2);
    });
  });

  describe('dependency analysis', () => {
    test('should extract dependencies from package.json', () => {
      const deps = contextEngine.analyzeDependencies(mockReactProject);

      expect(deps).toContainEqual({
        name: 'react',
        version: '^18.0.0',
        type: 'dependency',
        source: 'package.json'
      });

      expect(deps).toContainEqual({
        name: '@testing-library/react',
        version: '^13.0.0',
        type: 'devDependency',
        source: 'package.json'
      });
    });
  });
});

describe('File Scanner', () => {
  // Note: These tests would need a real file system or mocked fs
  // For now, we'll just test the utility functions

  describe('shouldIncludeContent', () => {
    test('should include JavaScript files', () => {
      const fileInfo = {
        name: 'test.js',
        extension: '.js',
        size: 1024,
        mimeType: 'application/javascript'
      };

      expect(fileScanner.shouldIncludeContent(fileInfo)).toBe(true);
    });

    test('should exclude binary files', () => {
      const fileInfo = {
        name: 'image.png',
        extension: '.png',
        size: 1024,
        mimeType: 'image/png'
      };

      expect(fileScanner.shouldIncludeContent(fileInfo)).toBe(false);
    });

    test('should exclude large files', () => {
      const fileInfo = {
        name: 'large.js',
        extension: '.js',
        size: 10 * 1024 * 1024, // 10MB
        mimeType: 'application/javascript'
      };

      expect(fileScanner.shouldIncludeContent(fileInfo)).toBe(false);
    });
  });

  describe('isBinaryFile', () => {
    test('should detect image files as binary', () => {
      const fileInfo = {
        name: 'test.jpg',
        extension: '.jpg',
        mimeType: 'image/jpeg'
      };

      expect(fileScanner.isBinaryFile(fileInfo)).toBe(true);
    });

    test('should detect JavaScript files as text', () => {
      const fileInfo = {
        name: 'test.js',
        extension: '.js',
        mimeType: 'application/javascript'
      };

      expect(fileScanner.isBinaryFile(fileInfo)).toBe(false);
    });
  });
});

// Integration test helper
describe('Integration Tests', () => {
  test('should handle empty file list gracefully', async () => {
    const result = await contextEngine.analyzeFiles([]);

    expect(result.totalFiles).toBe(0);
    expect(result.primaryLanguage).toBe('unknown');
    expect(result.confidence).toBeLessThan(0.5);
  });

  test('should handle files without content', async () => {
    const filesWithoutContent = [
      {
        path: 'test.js',
        name: 'test.js',
        extension: '.js',
        size: 1024,
        lastModified: new Date().toISOString()
        // No content property
      }
    ];

    const result = await contextEngine.analyzeFiles(filesWithoutContent);

    expect(result.totalFiles).toBe(1);
    expect(result.primaryLanguage).toBe('javascript'); // Should still detect from extension
  });
});
