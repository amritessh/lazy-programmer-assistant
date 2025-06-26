import express from 'express';

const router = express.Router();

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    // This would typically query the database for user's projects
    // For now, return a mock response
    res.json({
      success: true,
      projects: [
        {
          id: '1',
          name: 'Sample Project',
          description: 'A sample project for testing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // This would typically query the database for the specific project
    // For now, return a mock response
    res.json({
      success: true,
      project: {
        id,
        name: 'Sample Project',
        description: 'A sample project for testing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    // This would typically create a new project in the database
    // For now, return a mock response
    const newProject = {
      id: Date.now().toString(),
      name,
      description: description || '',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      project: newProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    // This would typically update the project in the database
    // For now, return a mock response
    const updatedProject = {
      id,
      name,
      description: description || '',
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // This would typically delete the project from the database
    // For now, return a mock response
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
