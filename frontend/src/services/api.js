
import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers
api.interceptors.request.use(
  (config) => {
    // Get auth token from localStorage or auth context
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.access_token) {
          config.headers.Authorization = `Bearer ${authData.access_token}`;
        }
      } catch (error) {
        console.warn('Failed to parse auth token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          toast.error('Authentication required. Please sign in.');
          // Redirect to login or refresh token
          window.location.href = '/login';
          break;
          
        case 403:
          toast.error('You don\'t have permission to perform this action.');
          break;
          
        case 404:
          toast.error('The requested resource was not found.');
          break;
          
        case 429:
          toast.error('Too many requests. Please slow down.');
          break;
          
        case 500:
          toast.error(data?.message || 'Internal server error. Please try again.');
          break;
          
        default:
          toast.error(data?.error || 'An unexpected error occurred.');
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Chat endpoints
  chat: {
    // Get all chat sessions
    getSessions: (params = {}) => {
      return api.get('/api/chat/sessions', { params });
    },

    // Create new chat session
    createSession: (data) => {
      return api.post('/api/chat/sessions', data);
    },

    // Get messages for a session
    getMessages: (sessionId, params = {}) => {
      return api.get(`/api/chat/sessions/${sessionId}/messages`, { params });
    },

    // Send message
    sendMessage: (sessionId, content) => {
      return api.post(`/api/chat/sessions/${sessionId}/messages`, { content });
    },

    // Delete session
    deleteSession: (sessionId) => {
      return api.delete(`/api/chat/sessions/${sessionId}`);
    },
  },

  // AI processing endpoints
  ai: {
    // Parse vague request
    parse: (text, context = null, userPreferences = null) => {
      return api.post('/api/ai/parse', {
        text,
        context,
        userPreferences,
      });
    },

    // Generate code
    generate: (description, context = null, userPreferences = null) => {
      return api.post('/api/ai/generate', {
        description,
        context,
        userPreferences,
      });
    },

    // Explain code
    explain: (code, context = null, userPreferences = null) => {
      return api.post('/api/ai/explain', {
        code,
        context,
        userPreferences,
      });
    },

    // Improve code
    improve: (code, improvementType = 'general', context = null, userPreferences = null) => {
      return api.post('/api/ai/improve', {
        code,
        improvementType,
        context,
        userPreferences,
      });
    },

    // Debug code
    debug: (code, error = null, context = null, userPreferences = null) => {
      return api.post('/api/ai/debug', {
        code,
        error,
        context,
        userPreferences,
      });
    },
  },

  // Project endpoints
  projects: {
    // Get all projects
    getAll: (params = {}) => {
      return api.get('/api/projects', { params });
    },

    // Get project by ID
    getById: (id) => {
      return api.get(`/api/projects/${id}`);
    },

    // Create project
    create: (data) => {
      return api.post('/api/projects', data);
    },

    // Update project
    update: (id, data) => {
      return api.put(`/api/projects/${id}`, data);
    },

    // Delete project
    delete: (id) => {
      return api.delete(`/api/projects/${id}`);
    },

    // Get project context
    getContext: (id) => {
      return api.get(`/api/context/projects/${id}/context`);
    },

    // Analyze project
    analyze: (data) => {
      return api.post('/api/context/analyze', data);
    },
  },

  // File endpoints
  files: {
    // Upload files
    upload: (files, projectId = null) => {
      const formData = new FormData();
      
      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      } else {
        formData.append('files', files);
      }
      
      if (projectId) {
        formData.append('projectId', projectId);
      }
      
      return api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    // Scan files
    scan: (path, options = {}) => {
      return api.post('/api/context/files/scan', { path, ...options });
    },
  },

  // User endpoints
  user: {
    // Get user profile
    getProfile: () => {
      return api.get('/api/user/profile');
    },

    // Update user profile
    updateProfile: (data) => {
      return api.put('/api/user/profile', data);
    },

    // Get user preferences
    getPreferences: () => {
      return api.get('/api/user/preferences');
    },

    // Update user preferences
    updatePreferences: (data) => {
      return api.put('/api/user/preferences', data);
    },
  },

  // Health check
  health: () => {
    return api.get('/health');
  },
};

// Helper functions for common operations
export const apiHelpers = {
  // Handle API response and extract data
  handleResponse: (response) => {
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'API request failed');
    }
  },

  // Handle API error and show appropriate message
  handleError: (error, customMessage = null) => {
    console.error('API Error:', error);
    
    if (customMessage) {
      toast.error(customMessage);
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else {
      toast.error('An unexpected error occurred');
    }
    
    throw error;
  },

  // Create a wrapper for API calls with error handling
  withErrorHandling: async (apiCall, customErrorMessage = null) => {
    try {
      const response = await apiCall();
      return apiHelpers.handleResponse(response);
    } catch (error) {
      apiHelpers.handleError(error, customErrorMessage);
    }
  },

  // Retry failed requests
  retry: async (apiCall, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on auth errors or client errors
        if (error.response?.status < 500) {
          throw error;
        }
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    throw lastError;
  },
};


export { api };

export default apiService;