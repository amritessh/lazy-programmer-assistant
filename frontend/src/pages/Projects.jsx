import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@contexts/ProjectContext.jsx';
import { useAuth } from '@contexts/AuthContext.jsx';

const Projects = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projects, loading, createProject, deleteProject, selectProject } =
    useProject();
  const { user } = useAuth();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      return;
    }

    const result = await createProject(newProject);
    if (result.success) {
      setOpenCreateDialog(false);
      setNewProject({ name: '', description: '' });
    }
  };

  const handleDeleteProject = async (projectId) => {
    const result = await deleteProject(projectId);
    if (result.success) {
      setProjectMenuAnchor(null);
      setSelectedProject(null);
    }
  };

  const handleProjectMenuOpen = (event, project) => {
    setProjectMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleSelectProject = (project) => {
    selectProject(project);
    handleProjectMenuClose();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <Typography>Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}
      >
        <Box>
          <Typography
            variant='h4'
            component='h1'
            sx={{ fontWeight: 700, mb: 1 }}
          >
            Projects
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage your coding projects and collaborate with others
          </Typography>
        </Box>

        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          New Project
        </Button>
      </Box>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <FolderIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant='h5' sx={{ mb: 2 }}>
            No projects yet
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}
          >
            Create your first project to start collaborating with AI and other
            developers
          </Typography>
          <Button
            variant='contained'
            size='large'
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Your First Project
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 48,
                        height: 48
                      }}
                    >
                      <FolderIcon />
                    </Avatar>
                    <IconButton
                      size='small'
                      onClick={(e) => handleProjectMenuOpen(e, project)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {project.name}
                  </Typography>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {project.description || 'No description provided'}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <Chip
                      label={project.owner_id === user?.id ? 'Owner' : 'Member'}
                      size='small'
                      color={
                        project.owner_id === user?.id ? 'primary' : 'default'
                      }
                    />
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(project.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ pt: 0 }}>
                  <Button
                    size='small'
                    startIcon={<ChatIcon />}
                    onClick={() => navigate(`/chat?project=${project.id}`)}
                    sx={{ flexGrow: 1 }}
                  >
                    Start Chat
                  </Button>
                  <Button
                    size='small'
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color='primary'
        aria-label='add project'
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={() => setOpenCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Project Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Project Name'
            fullWidth
            variant='outlined'
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin='dense'
            label='Description (optional)'
            fullWidth
            variant='outlined'
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant='contained'
            disabled={!newProject.name.trim()}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Menu */}
      <Menu
        anchorEl={projectMenuAnchor}
        open={Boolean(projectMenuAnchor)}
        onClose={handleProjectMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={() => handleSelectProject(selectedProject)}>
          <ListItemIcon>
            <PersonIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Select Project</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => navigate(`/projects/${selectedProject?.id}/settings`)}
        >
          <ListItemIcon>
            <SettingsIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Project Settings</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => navigate(`/projects/${selectedProject?.id}/edit`)}
        >
          <ListItemIcon>
            <EditIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem>

        {selectedProject?.owner_id === user?.id && (
          <MenuItem
            onClick={() => handleDeleteProject(selectedProject.id)}
            sx={{ color: theme.palette.error.main }}
          >
            <ListItemIcon>
              <DeleteIcon
                fontSize='small'
                sx={{ color: theme.palette.error.main }}
              />
            </ListItemIcon>
            <ListItemText>Delete Project</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Projects;
