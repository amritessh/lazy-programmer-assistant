const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const mime = require('mime-types');

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
    return new Promise((resolve, reject) => {
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

      glob(pattern, globOptions, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        // Limit number of files
        if (maxFiles && files.length > maxFiles) {
          console.warn(`Found ${files.length} files, limiting to ${maxFiles}`);
          files = files.slice(0, maxFiles);
        }

        resolve(files);
      });
    });
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
   * Determine if we should include file content
   */
  shouldIncludeContent(fileInfo) {
    // Skip binary files
    if (this.isBinaryFile(fileInfo)) {
      return false;
    }

    // Skip large files
    if (fileInfo.size > this.maxContentSize) {
      return false;
    }

    // Include files with relevant extensions
    return this.contentExtensions.includes(fileInfo.extension);
  }

  /**
   * Check if file is likely binary
   */
  isBinaryFile(fileInfo) {
    const binaryExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.ico',
      '.svg',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.zip',
      '.tar',
      '.gz',
      '.7z',
      '.rar',
      '.mp3',
      '.mp4',
      '.avi',
      '.mov',
      '.wmv',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot'
    ];

    const binaryMimeTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'application/zip',
      'application/octet-stream'
    ];

    // Check extension
    if (binaryExtensions.includes(fileInfo.extension)) {
      return true;
    }

    // Check MIME type
    if (
      fileInfo.mimeType &&
      binaryMimeTypes.some(type => fileInfo.mimeType.startsWith(type))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Read file content with size limits and encoding detection
   */
  async readFileContent(filePath, fileSize) {
    try {
      // Skip very large files
      if (fileSize > this.maxContentSize) {
        return null;
      }

      // Read file
      let content = await fs.readFile(filePath, 'utf8');

      // Check for potential binary content by looking for null bytes
      if (content.includes('\0')) {
        return null;
      }

      // Truncate very long content
      const maxContentLength = 50000; // 50KB of text
      if (content.length > maxContentLength) {
        content =
          content.substring(0, maxContentLength) + '\n\n... [truncated]';
      }

      return content;
    } catch (error) {
      // Might be binary or encoding issue
      if (error.code === 'EISDIR') {
        return null;
      }

      // Try reading as buffer to check if it's text
      try {
        const buffer = await fs.readFile(filePath);
        if (this.isTextBuffer(buffer)) {
          return buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
        }
      } catch (bufferError) {
        // Give up
      }

      return null;
    }
  }

  /**
   * Check if buffer contains text (not binary)
   */
  isTextBuffer(buffer) {
    // Check for null bytes (common in binary files)
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      if (buffer[i] === 0) {
        return false;
      }
    }

    // Check for high percentage of printable ASCII characters
    let printableCount = 0;
    const sampleSize = Math.min(buffer.length, 1000);

    for (let i = 0; i < sampleSize; i++) {
      const byte = buffer[i];
      if (
        (byte >= 32 && byte <= 126) ||
        byte === 9 ||
        byte === 10 ||
        byte === 13
      ) {
        printableCount++;
      }
    }

    return printableCount / sampleSize > 0.85; // 85% printable characters
  }

  /**
   * Get quick directory stats without full scan
   */
  async getDirectoryStats(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error('Not a directory');
      }

      // Get quick counts
      const entries = await fs.readdir(dirPath);
      let fileCount = 0;
      let dirCount = 0;

      for (const entry of entries.slice(0, 100)) {
        // Sample first 100 entries
        try {
          const entryPath = path.join(dirPath, entry);
          const entryStat = await fs.stat(entryPath);
          if (entryStat.isFile()) {
            fileCount++;
          } else if (entryStat.isDirectory()) {
            dirCount++;
          }
        } catch (e) {
          // Skip problematic entries
        }
      }

      return {
        totalEntries: entries.length,
        estimatedFiles: fileCount,
        estimatedDirectories: dirCount,
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get directory stats: ${error.message}`);
    }
  }

  /**
   * Scan specific files by paths
   */
  async scanFiles(filePaths, includeContent = false) {
    const results = [];

    for (const filePath of filePaths) {
      try {
        const fullPath = path.resolve(filePath);
        const relativePath = path.basename(filePath);
        const basePath = path.dirname(fullPath);

        const fileInfo = await this.processFile(
          basePath,
          relativePath,
          includeContent
        );
        if (fileInfo) {
          results.push({
            ...fileInfo,
            path: fullPath // Use full path for individual files
          });
        }
      } catch (error) {
        console.warn(`Error scanning file ${filePath}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Find files matching specific patterns
   */
  async findFiles(basePath, patterns, options = {}) {
    const results = [];

    for (const pattern of patterns) {
      try {
        const files = await this.globFiles(basePath, pattern, {
          ignore: options.ignore || this.defaultIgnorePatterns,
          maxDepth: options.maxDepth || 5,
          maxFiles: options.maxFiles || 1000
        });

        for (const file of files) {
          const fileInfo = await this.processFile(
            basePath,
            file,
            options.includeContent
          );
          if (fileInfo) {
            results.push(fileInfo);
          }
        }
      } catch (error) {
        console.warn(`Error with pattern ${pattern}:`, error.message);
      }
    }

    return results;
  }
}

module.exports = new FileScanner();
