const contextEngine = require('../services/contextEngine');
const fileScanner = require('../services/fileScanner');
const gitAnalysis = require('../services/gitAnalysis');

const contextController = {
  /**
   * Analyze project structure and context
   */
  async analyzeProject(req, res) {
    try {
      const { projectPath, userId, projectId } = req.body;

      if (!projectPath) {
        return res.status(400).json({
          success: false,
          error: 'Project path is required'
        });
      }

      // Analyze project structure
      const projectStructure = await fileScanner.scanProjectStructure(
        projectPath
      );

      // Analyze Git history if available
      const gitContext = await gitAnalysis.analyzeGitHistory(projectPath);

      // Generate project context
      const context = await contextEngine.generateProjectContext({
        projectStructure,
        gitContext,
        userId,
        projectId
      });

      res.json({
        success: true,
        data: {
          context,
          projectStructure,
          gitContext
        },
        message: 'Project analyzed successfully'
      });
    } catch (error) {
      console.error('Error analyzing project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze project'
      });
    }
  },

  /**
   * Scan files in project
   */
  async scanFiles(req, res) {
    try {
      const { projectPath, fileTypes, excludePatterns } = req.body;

      if (!projectPath) {
        return res.status(400).json({
          success: false,
          error: 'Project path is required'
        });
      }

      const scanResult = await fileScanner.scanFiles(projectPath, {
        fileTypes: fileTypes || [
          'js',
          'jsx',
          'ts',
          'tsx',
          'py',
          'java',
          'cpp',
          'c',
          'go',
          'rs'
        ],
        excludePatterns: excludePatterns || [
          'node_modules',
          '.git',
          'dist',
          'build'
        ]
      });

      res.json({
        success: true,
        data: scanResult,
        message: 'Files scanned successfully'
      });
    } catch (error) {
      console.error('Error scanning files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scan files'
      });
    }
  },

  /**
   * Get project context
   */
  async getProjectContext(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }

      // This would typically fetch from database
      // For now, return mock data
      const context = {
        projectId,
        userId,
        lastAnalyzed: new Date().toISOString(),
        structure: {
          totalFiles: 150,
          languages: ['javascript', 'typescript', 'python'],
          frameworks: ['react', 'express', 'fastapi'],
          dependencies: ['axios', 'lodash', 'moment']
        },
        gitContext: {
          lastCommit: '2024-01-15T10:30:00Z',
          branch: 'main',
          recentChanges: ['Added new API endpoint', 'Fixed authentication bug']
        }
      };

      res.json({
        success: true,
        data: context,
        message: 'Project context retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting project context:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project context'
      });
    }
  },

  /**
   * Update project context
   */
  async updateProjectContext(req, res) {
    try {
      const { projectId } = req.params;
      const { context } = req.body;
      const userId = req.headers['x-user-id'];

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }

      if (!context) {
        return res.status(400).json({
          success: false,
          error: 'Context data is required'
        });
      }

      // This would typically update the database
      // For now, return mock response
      const updatedContext = {
        ...context,
        projectId,
        userId,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: updatedContext,
        message: 'Project context updated successfully'
      });
    } catch (error) {
      console.error('Error updating project context:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project context'
      });
    }
  }
};

module.exports = contextController;
