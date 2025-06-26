import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import mime from 'mime-types';

class FileScanner {
  constructor() {
    // Default ignore patterns
    this.defaultIgnorePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '.nyc_output/**',
      'logs/**',
      '*.log',
      '.env',
      '.env.*',
      'package-lock.json',
      'yarn.lock',
      '.DS_Store',
      'Thumbs.db',
      '*.min.js',
      '*.min.css',
      '.vscode/**',
      '.idea/**'
    ];

    // File extensions we're interested in for content analysis
    this.contentExtensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.py',
      '.java',
      '.cs',
      '.cpp',
      '.c',
      '.h',
      '.html',
      '.css',
      '.scss',
      '.sass',
      '.less',
      '.json',
      '.xml',
      '.yaml',
      '.yml',
      '.md',
      '.txt',
      '.env',
      '.php',
      '.rb',
      '.go',
      '.rs',
      '.vue',
      '.svelte'
    ];

    // Maximum file size to read content (5MB)
    this.maxContentSize = 5 * 1024 * 1024;
  }

  /**
   * Scan directory and return file information
   */
  async scanDirectory(dirPath, options = {}) {
    try {
      const {
        extensions = null,
        maxDepth = 5,
        includeContent = false,
        ignorePatterns = [],
        maxFiles = 1000
      } = options;

      // Verify directory exists
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${dirPath}`);
      }

      // Combine ignore patterns
      const allIgnorePatterns = [
        ...this.defaultIgnorePatterns,
        ...ignorePatterns
      ];

      // Build glob pattern
      let globPattern;
      if (extensions && extensions.length > 0) {
        const extPattern =
          extensions.length === 1 ? extensions[0] : `{${extensions.join(',')}}`;
        globPattern = `**/*${extPattern}`;
      } else {
        globPattern = '**/*';
      }

      // Find files using glob
      const files = await this.globFiles(dirPath, globPattern, {
        ignore: allIgnorePatterns,
        maxDepth,
        maxFiles
      });

      // Process each file
      const processedFiles = await Promise.all(
        files.map(filePath =>
          this.processFile(dirPath, filePath, includeContent)
        )
      );

      // Filter out failed file processing
      return processedFiles.filter(file => file !== null);
    } catch (error) {
      console.error('Error scanning directory:', error);
      throw new Error(`Failed to scan directory: ${error.message}`);
    }
  }

  /**
   * Use glob to find files with patterns and limits
   */
  async globFiles(basePath, pattern, options) {
    const { ignore, maxDepth, maxFiles } = options;

    const globOptions = {
      cwd: basePath,
      ignore,
      nodir: true, // Only files, not directories
      realpath: false,
      follow: false // Don't follow symlinks
    };

    if (maxDepth) {
      // Limit depth by modifying pattern
      const depthPattern = '*'.repeat(maxDepth).split('').join('/');
      pattern = pattern.replace('**', depthPattern);
    }

    let files = await glob(pattern, globOptions);

    // Limit number of files
    if (maxFiles && files.length > maxFiles) {
      console.warn(`Found ${files.length} files, limiting to ${maxFiles}`);
      files = files.slice(0, maxFiles);
    }

    return files;
  }

  /**
   * Process individual file
   */
  async processFile(basePath, relativePath, includeContent) {
    try {
      const fullPath = path.join(basePath, relativePath);
      const stats = await fs.stat(fullPath);

      if (!stats.isFile()) {
        return null;
      }

      const fileInfo = {
        path: relativePath,
        name: path.basename(relativePath),
        extension: path.extname(relativePath).toLowerCase(),
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        isDirectory: false,
        mimeType: mime.lookup(relativePath) || 'unknown'
      };

      // Add content if requested and file is suitable
      if (includeContent && this.shouldIncludeContent(fileInfo)) {
        try {
          const content = await this.readFileContent(fullPath, stats.size);
          if (content !== null) {
            fileInfo.content = content;
          }
        } catch (contentError) {
          console.warn(
            `Could not read content for ${relativePath}:`,
            contentError.message
          );
        }
      }

      return fileInfo;
    } catch (error) {
      console.warn(`Error processing file ${relativePath}:`, error.message);
      return null;
    }
  }

  /**
   * Determine if file content should be included
   */
  shouldIncludeContent(fileInfo) {
    // Check file size
    if (fileInfo.size > this.maxContentSize) {
      return false;
    }

    // Check if it's a content extension
    if (this.contentExtensions.includes(fileInfo.extension)) {
      return true;
    }

    // Check mime type
    if (fileInfo.mimeType && fileInfo.mimeType.startsWith('text/')) {
      return true;
    }

    return false;
  }

  /**
   * Check if file is binary
   */
  isBinaryFile(fileInfo) {
    // Check mime type first
    if (fileInfo.mimeType && !fileInfo.mimeType.startsWith('text/')) {
      return true;
    }

    // Check file extension
    const binaryExtensions = [
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.bin',
      '.dat',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.ico',
      '.mp3',
      '.mp4',
      '.avi',
      '.mov',
      '.wav',
      '.flac',
      '.zip',
      '.tar',
      '.gz',
      '.rar',
      '.7z',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.db',
      '.sqlite',
      '.sqlite3'
    ];

    return binaryExtensions.includes(fileInfo.extension);
  }

  /**
   * Read file content safely
   */
  async readFileContent(filePath, fileSize) {
    try {
      // Check file size
      if (fileSize > this.maxContentSize) {
        console.warn(`File too large to read: ${filePath}`);
        return null;
      }

      // Read file as buffer first
      const buffer = await fs.readFile(filePath);

      // Check if it's a text file
      if (!this.isTextBuffer(buffer)) {
        console.warn(`Binary file detected: ${filePath}`);
        return null;
      }

      // Convert to string
      return buffer.toString('utf8');
    } catch (error) {
      console.warn(`Error reading file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check if buffer contains text
   */
  isTextBuffer(buffer) {
    // Check for null bytes (common in binary files)
    if (buffer.includes(0)) {
      return false;
    }

    // Check for high percentage of printable characters
    let printableCount = 0;
    const totalBytes = Math.min(buffer.length, 1000); // Check first 1000 bytes

    for (let i = 0; i < totalBytes; i++) {
      const byte = buffer[i];
      // Printable ASCII characters (32-126) plus common whitespace (9, 10, 13)
      if ((byte >= 32 && byte <= 126) || [9, 10, 13].includes(byte)) {
        printableCount++;
      }
    }

    const printableRatio = printableCount / totalBytes;
    return printableRatio > 0.8; // 80% printable characters
  }

  /**
   * Get directory statistics
   */
  async getDirectoryStats(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      const files = await this.scanDirectory(dirPath, { maxFiles: 100 });

      return {
        path: dirPath,
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        lastModified: stats.mtime.toISOString(),
        fileTypes: this.countFileTypes(files)
      };
    } catch (error) {
      console.error('Error getting directory stats:', error);
      throw error;
    }
  }

  /**
   * Count file types in a list of files
   */
  countFileTypes(files) {
    const typeCount = {};
    files.forEach(file => {
      const ext = file.extension;
      typeCount[ext] = (typeCount[ext] || 0) + 1;
    });
    return typeCount;
  }

  /**
   * Scan specific files
   */
  async scanFiles(filePaths, includeContent = false) {
    const results = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const fileInfo = {
          path: filePath,
          name: path.basename(filePath),
          extension: path.extname(filePath).toLowerCase(),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          isDirectory: stats.isDirectory(),
          mimeType: mime.lookup(filePath) || 'unknown'
        };

        if (
          includeContent &&
          !stats.isDirectory() &&
          this.shouldIncludeContent(fileInfo)
        ) {
          const content = await this.readFileContent(filePath, stats.size);
          if (content !== null) {
            fileInfo.content = content;
          }
        }

        results.push(fileInfo);
      } catch (error) {
        console.warn(`Error scanning file ${filePath}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Find files matching patterns
   */
  async findFiles(basePath, patterns, options = {}) {
    const { ignore = [], maxFiles = 1000 } = options;
    const allIgnorePatterns = [...this.defaultIgnorePatterns, ...ignore];

    const results = [];
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: basePath,
          ignore: allIgnorePatterns,
          nodir: true,
          realpath: false
        });

        results.push(...files);
      } catch (error) {
        console.warn(`Error with pattern ${pattern}:`, error.message);
      }
    }

    // Remove duplicates and limit results
    const uniqueFiles = [...new Set(results)];
    return uniqueFiles.slice(0, maxFiles);
  }

  /**
   * Scan project structure (simplified version for now)
   */
  async scanProjectStructure(projectPath) {
    try {
      // For now, return a mock structure
      return {
        totalFiles: 150,
        directories: ['src', 'public', 'components', 'services'],
        fileTypes: {
          '.js': 45,
          '.jsx': 25,
          '.ts': 15,
          '.tsx': 10,
          '.json': 5,
          '.md': 3,
          '.css': 20,
          '.html': 2
        },
        structure: {
          src: {
            files: [],
            subdirs: {
              components: { files: [], subdirs: {} },
              services: { files: [], subdirs: {} }
            }
          },
          public: { files: [], subdirs: {} }
        }
      };
    } catch (error) {
      console.error('Error scanning project structure:', error);
      throw error;
    }
  }
}

export default new FileScanner();
