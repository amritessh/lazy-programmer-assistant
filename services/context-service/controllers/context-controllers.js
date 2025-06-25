const { createClient } = require('@supabase/supabase-js');
const contextEngine = require('../services/contextEngine');
const fileScanner = require('../services/fileScanner');
const gitAnalysis = require('../services/gitAnalysis');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const contextController = {
  // Analyze project context
  async analyzeProject(req, res) {
    try {
      const { projectId, projectPath, files } = req.body;
      const userId = req.headers['x-user-id'];

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      let project = null;

      // Get project info if projectId provided
      if (projectId) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', userId)
          .single();

        if (projectError && projectError.code !== 'PGRST116') {
          throw projectError;
        }
        project = projectData;
      }

      // Determine analysis source
      let analysisResult;

      if (files && files.length > 0) {
        // Analyze provided files
        analysisResult = await contextEngine.analyzeFiles(files);
      } else if (projectPath || (project && project.project_path)) {
        // Scan project directory
        const pathToScan = projectPath || project.project_path;
        const scannedFiles = await fileScanner.scanDirectory(pathToScan);
        analysisResult = await contextEngine.analyzeFiles(scannedFiles);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either projectId, projectPath, or files array is required'
        });
      }

      // Get git information if project path available
      let gitInfo = null;
      const scanPath = projectPath || (project && project.project_path);
      if (scanPath) {
        try {
          gitInfo = await gitAnalysis.analyzeRepository(scanPath);
        } catch (gitError) {
          console.log(
            'Git analysis failed (not a git repo?):',
            gitError.message
          );
        }
      }

      // Combine all context data
      const contextData = {
        ...analysisResult,
        gitInfo,
        analyzedAt: new Date().toISOString(),
        source: files ? 'uploaded_files' : 'project_directory'
      };

      // Update project context if projectId exists
      if (project) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            context_data: contextData,
            language: analysisResult.primaryLanguage,
            framework: analysisResult.framework,
            updated_at: new Date().toISOString()
          })
          .eq('id', project.id);

        if (updateError) {
          console.error('Error updating project context:', updateError);
        }
      }

      res.json({
        success: true,
        data: {
          context: contextData,
          summary: analysisResult.summary,
          relevantFiles: analysisResult.relevantFiles,
          suggestions: analysisResult.suggestions
        },
        message: 'Project context analyzed successfully'
      });
    } catch (error) {
      console.error('Error analyzing project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze project context'
      });
    }
  },

  // Scan files in a directory
  async scanFiles(req, res) {
    try {
      const { path, extensions, maxDepth, includeContent } = req.body;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: 'Path is required'
        });
      }

      const options = {
        extensions: extensions || null,
        maxDepth: maxDepth || 5,
        includeContent: includeContent || false
      };

      const files = await fileScanner.scanDirectory(path, options);

      res.json({
        success: true,
        data: files,
        message: `Scanned ${files.length} files`
      });
    } catch (error) {
      console.error('Error scanning files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scan files'
      });
    }
  },

  // Get project context
  async getProjectContext(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.headers['x-user-id'];

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (error || !project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      res.json({
        success: true,
        data: {
          project,
          context: project.context_data || null
        }
      });
    } catch (error) {
      console.error('Error fetching project context:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch project context'
      });
    }
  },

  // Update project context
  async updateProjectContext(req, res) {
    try {
      const { projectId } = req.params;
      const { contextData } = req.body;
      const userId = req.headers['x-user-id'];

      // Verify project ownership
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Update context
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          context_data: contextData,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      res.json({
        success: true,
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
