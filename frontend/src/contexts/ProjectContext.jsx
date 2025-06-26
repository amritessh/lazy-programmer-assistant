// frontend/src/contexts/ProjectContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@services/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ProjectContext = createContext({});

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);

  // Fetch all projects for the current user
  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (projectData) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setProjectLoading(true);

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description || '',
          user_id: user.id,
          settings: projectData.settings || {}
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        toast.error('Failed to create project');
        return { success: false, error: projectError };
      }

      // Add the owner as a project member
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding project member:', memberError);
        // Try to delete the project if member creation fails
        await supabase.from('projects').delete().eq('id', project.id);
        toast.error('Failed to create project');
        return { success: false, error: memberError };
      }

      // Refresh projects list
      await fetchProjects();

      toast.success('Project created successfully');
      return { success: true, data: project };
    } catch (error) {
      console.error('Error in createProject:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setProjectLoading(false);
    }
  };

  // Update a project
  const updateProject = async (projectId, updates) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setProjectLoading(true);

      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
        return { success: false, error };
      }

      // Update local state
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, ...data } : project
        )
      );

      if (currentProject?.id === projectId) {
        setCurrentProject(data);
      }

      toast.success('Project updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error in updateProject:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setProjectLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (projectId) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setProjectLoading(true);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
        return { success: false, error };
      }

      // Update local state
      setProjects((prev) => prev.filter((project) => project.id !== projectId));

      // Clear current project if it was deleted
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }

      toast.success('Project deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteProject:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setProjectLoading(false);
    }
  };

  // Select a project
  const selectProject = (project) => {
    setCurrentProject(project);
    // Store in localStorage for persistence
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  };

  // Get project by ID
  const getProjectById = (projectId) => {
    return projects.find((project) => project.id === projectId);
  };

  // Add member to project
  const addProjectMember = async (projectId, email, role = 'member') => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setProjectLoading(true);

      // First, get the user by email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast.error('User not found');
        return { success: false, error: 'User not found' };
      }

      // Add member to project
      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: userData.id,
        role
      });

      if (error) {
        console.error('Error adding project member:', error);
        toast.error('Failed to add member to project');
        return { success: false, error };
      }

      toast.success('Member added successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in addProjectMember:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setProjectLoading(false);
    }
  };

  // Remove member from project
  const removeProjectMember = async (projectId, userId) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setProjectLoading(true);

      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing project member:', error);
        toast.error('Failed to remove member from project');
        return { success: false, error };
      }

      toast.success('Member removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeProjectMember:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setProjectLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
    }
  }, [user]);

  // Restore current project from localStorage
  useEffect(() => {
    if (projects.length > 0) {
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId) {
        const project = projects.find((p) => p.id === savedProjectId);
        if (project) {
          setCurrentProject(project);
        }
      } else if (projects.length > 0) {
        // Default to first project if none selected
        setCurrentProject(projects[0]);
      }
    }
  }, [projects]);

  const value = {
    projects,
    currentProject,
    loading,
    projectLoading,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    getProjectById,
    addProjectMember,
    removeProjectMember,
    fetchProjects
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
