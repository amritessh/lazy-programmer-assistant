import React from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@contexts/ProjectContext.jsx';
import { useAuth } from '@contexts/AuthContext.jsx';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projects, loading } = useProject();
  const { user, profile } = useAuth();

  const recentProjects = projects.slice(0, 3);
  const totalProjects = projects.length;

  const quickActions = [
    {
      title: 'New Project',
      description: 'Create a new coding project',
      icon: <AddIcon />,
      action: () => navigate('/projects'),
      color: theme.palette.primary.main
    },
    {
      title: 'Start Chat',
      description: 'Begin a new conversation',
      icon: <ChatIcon />,
      action: () => navigate('/chat'),
      color: theme.palette.secondary.main
    },
    {
      title: 'View Projects',
      description: 'Manage your projects',
      icon: <FolderIcon />,
      action: () => navigate('/projects'),
      color: theme.palette.success.main
    }
  ];

  const stats = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: <FolderIcon />,
      color: theme.palette.primary.main
    },
    {
      title: 'Active Sessions',
      value: '0',
      icon: <ChatIcon />,
      color: theme.palette.secondary.main
    },
    {
      title: 'This Week',
      value: '0',
      icon: <TrendingUpIcon />,
      color: theme.palette.success.main
    }
  ];

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
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' component='h1' sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back,{' '}
          {profile?.full_name || user?.email?.split('@')[0] || 'Developer'}! 👋
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Ready to build something amazing today?
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                border: `1px solid ${stat.color}20`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 700 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography variant='h5' component='h2' sx={{ fontWeight: 600, mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
              onClick={action.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: action.color,
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant='h6'
                      component='div'
                      sx={{ fontWeight: 600 }}
                    >
                      {action.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {action.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Projects */}
      <Typography variant='h5' component='h2' sx={{ fontWeight: 600, mb: 3 }}>
        Recent Projects
      </Typography>

      {recentProjects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant='h6' sx={{ mb: 1 }}>
              No projects yet
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Create your first project to get started
            </Typography>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects')}
            >
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {recentProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 40,
                        height: 40,
                        mr: 2
                      }}
                    >
                      <FolderIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant='h6'
                        component='div'
                        sx={{ fontWeight: 600 }}
                      >
                        {project.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {project.description || 'No description'}
                      </Typography>
                    </Box>
                  </Box>

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

                <CardActions>
                  <Button
                    size='small'
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat?project=${project.id}`);
                    }}
                  >
                    Start Chat
                  </Button>
                  <Button
                    size='small'
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recent Activity */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ fontWeight: 600, mb: 3, mt: 4 }}
      >
        Recent Activity
      </Typography>

      <Card>
        <CardContent>
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <ScheduleIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary='Welcome to Lazy Programmer Assistant'
                secondary="You've successfully logged in to your account"
              />
              <Typography variant='caption' color='text.secondary'>
                Just now
              </Typography>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
