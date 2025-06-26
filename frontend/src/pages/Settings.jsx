import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

const Settings = () => {
  const theme = useTheme();
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    autoSave: true
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // This would typically call an API to update the profile
      // For now, we'll just show a success message
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key) => (event) => {
    setPreferences({
      ...preferences,
      [key]: event.target.checked
    });
  };

  const settingsSections = [
    {
      title: 'Profile',
      icon: <PersonIcon />,
      items: [
        {
          primary: 'Full Name',
          secondary: 'Update your display name',
          action: (
            <TextField
              size='small'
              value={profileData.full_name}
              onChange={(e) =>
                setProfileData({ ...profileData, full_name: e.target.value })
              }
              placeholder='Enter your full name'
            />
          )
        },
        {
          primary: 'Username',
          secondary: 'Your unique username',
          action: (
            <TextField
              size='small'
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
              placeholder='Enter username'
            />
          )
        },
        {
          primary: 'Bio',
          secondary: 'Tell us about yourself',
          action: (
            <TextField
              size='small'
              multiline
              rows={2}
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              placeholder='Write a short bio'
            />
          )
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      items: [
        {
          primary: 'Email Notifications',
          secondary: 'Receive notifications via email',
          action: (
            <Switch
              checked={preferences.emailNotifications}
              onChange={handlePreferenceChange('emailNotifications')}
            />
          )
        },
        {
          primary: 'Push Notifications',
          secondary: 'Receive push notifications',
          action: (
            <Switch
              checked={preferences.pushNotifications}
              onChange={handlePreferenceChange('pushNotifications')}
            />
          )
        }
      ]
    },
    {
      title: 'Preferences',
      icon: <PaletteIcon />,
      items: [
        {
          primary: 'Dark Mode',
          secondary: 'Use dark theme',
          action: (
            <Switch
              checked={preferences.darkMode}
              onChange={handlePreferenceChange('darkMode')}
            />
          )
        },
        {
          primary: 'Auto Save',
          secondary: 'Automatically save your work',
          action: (
            <Switch
              checked={preferences.autoSave}
              onChange={handlePreferenceChange('autoSave')}
            />
          )
        }
      ]
    },
    {
      title: 'Account',
      icon: <SecurityIcon />,
      items: [
        {
          primary: 'Email',
          secondary: user?.email || 'No email set',
          action: null
        },
        {
          primary: 'Account Created',
          secondary: user?.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : 'Unknown',
          action: null
        }
      ]
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' component='h1' sx={{ fontWeight: 700, mb: 1 }}>
          Settings
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: theme.palette.primary.main
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || user?.email}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <PersonIcon sx={{ fontSize: 40 }} />
                )}
              </Avatar>

              <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </Typography>

              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                {profile?.bio || 'No bio provided'}
              </Typography>

              <Button
                variant='outlined'
                fullWidth
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Sections */}
        <Grid item xs={12} md={8}>
          {settingsSections.map((section, sectionIndex) => (
            <Card key={section.title} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: theme.palette.primary.main + '20',
                      color: theme.palette.primary.main,
                      mr: 2
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                </Box>

                <List>
                  {section.items.map((item, itemIndex) => (
                    <React.Fragment key={item.primary}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.primary.main
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.primary}
                          secondary={item.secondary}
                          sx={{ mr: 2 }}
                        />
                        {item.action && (
                          <ListItemSecondaryAction>
                            {item.action}
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {itemIndex < section.items.length - 1 && (
                        <Divider sx={{ ml: 6 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}

          {/* Additional Settings */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: theme.palette.info.main + '20',
                    color: theme.palette.info.main,
                    mr: 2
                  }}
                >
                  <HelpIcon />
                </Box>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Support & Help
                </Typography>
              </Box>

              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: theme.palette.info.main
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary='Documentation'
                    secondary='Read our documentation and guides'
                  />
                  <Button size='small' variant='outlined'>
                    View Docs
                  </Button>
                </ListItem>

                <Divider sx={{ ml: 6 }} />

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: theme.palette.info.main
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary='Contact Support'
                    secondary='Get help from our support team'
                  />
                  <Button size='small' variant='outlined'>
                    Contact
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
