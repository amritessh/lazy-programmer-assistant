import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService, { apiHelpers } from '@services/api';
import toast from 'react-hot-toast';

export const useChat = (sessionId = null) => {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const navigate = useNavigate();
  const messagesRef = useRef(messages);
  const abortControllerRef = useRef(null);

  // Update messages ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load session data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      // Clear current session
      setCurrentSession(null);
      setMessages([]);
      setError(null);
    }

    // Cleanup on unmount or session change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sessionId]);

  // Load all sessions
  const loadSessions = useCallback(async () => {
    try {
      const response = await apiService.chat.getSessions({
        page: 1,
        limit: 50,
      });
      const data = apiHelpers.handleResponse(response);
      setSessions(data.data || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Don't show error toast for sessions loading
    }
  }, []);

  // Load specific session
  const loadSession = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      // Load session details and messages in parallel
      const [sessionResponse, messagesResponse] = await Promise.all([
        apiService.chat.getSessions(), // We'll find the session in the list
        apiService.chat.getMessages(id, { limit: 100 })
      ]);

      const sessionsData = apiHelpers.handleResponse(sessionResponse);
      const session = sessionsData.data?.find(s => s.id === id);
      
      if (session) {
        setCurrentSession(session);
      }

      const messagesData = apiHelpers.handleResponse(messagesResponse);
      setMessages(messagesData.data || []);

      // Generate suggestions based on conversation context
      generateSuggestions(messagesData.data || []);

    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load chat session');
      toast.error('Failed to load chat session');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new session
  const createSession = useCallback(async (title = 'New Chat', projectId = null) => {
    try {
      setLoading(true);
      const response = await apiService.chat.createSession({
        title,
        projectId,
      });
      
      const data = apiHelpers.handleResponse(response);
      const newSession = data;
      
      setCurrentSession(newSession);
      setMessages([]);
      setError(null);
      
      // Navigate to new session
      navigate(`/chat/${newSession.id}`);
      
      // Refresh sessions list
      loadSessions();
      
      toast.success('New chat session created');
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Failed to create chat session');
      toast.error('Failed to create chat session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [navigate, loadSessions]);

  // Send message
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!content.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsTyping(true);
      setError(null);

      // If no current session, create one
      let session = currentSession;
      if (!session) {
        session = await createSession('New Chat', options.projectId);
      }

      // Add user message immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      setMessages(prev => [...prev, userMessage]);

      // Send message to API
      const response = await apiService.chat.sendMessage(session.id, content);
      const data = apiHelpers.handleResponse(response);

      // Replace temporary message with actual messages from server
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [
          ...filtered,
          data.userMessage,
          data.assistantMessage,
        ];
      });

      // Update suggestions based on new conversation
      generateSuggestions([...messagesRef.current, data.userMessage, data.assistantMessage]);

      // Clear abort controller
      abortControllerRef.current = null;

    } catch (error) {
      // Remove temporary message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage?.id));
      
      if (error.name === 'AbortError') {
        // Request was cancelled
        return;
      }

      console.error('Failed to send message:', error);
      setError('Failed to send message');
      
      // Show specific error message if available
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      toast.error(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [currentSession, createSession]);

  // Delete session
  const deleteSession = useCallback(async (id) => {
    try {
      await apiService.chat.deleteSession(id);
      
      // Remove from sessions list
      setSessions(prev => prev.filter(s => s.id !== id));
      
      // If deleting current session, navigate away
      if (currentSession?.id === id) {
        navigate('/chat');
      }
      
      toast.success('Chat session deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete chat session');
    }
  }, [currentSession, navigate]);

  // Generate contextual suggestions
  const generateSuggestions = useCallback((messageHistory) => {
    const recentMessages = messageHistory.slice(-6); // Last 6 messages
    const newSuggestions = [];

    // Analyze recent conversation to generate suggestions
    const hasCode = recentMessages.some(m => 
      m.content.includes('```') || m.metadata?.codeGenerated
    );
    
    const hasError = recentMessages.some(m => 
      m.content.toLowerCase().includes('error') || 
      m.content.toLowerCase().includes('bug')
    );

    const lastAssistantMessage = recentMessages
      .filter(m => m.role === 'assistant')
      .pop();

    // Context-based suggestions
    if (hasCode) {
      newSuggestions.push('explain this code', 'improve this code', 'add error handling');
    }

    if (hasError) {
      newSuggestions.push('fix this error', 'debug this issue', 'what went wrong?');
    }

    if (lastAssistantMessage && lastAssistantMessage.metadata?.assumptions) {
      newSuggestions.push('that\'s correct', 'not quite right', 'try a different approach');
    }

    // General helpful suggestions
    if (newSuggestions.length < 3) {
      const generalSuggestions = [
        'make it work',
        'add more features',
        'optimize this',
        'make it pretty',
        'add tests',
        'refactor this',
      ];
      
      generalSuggestions.forEach(suggestion => {
        if (newSuggestions.length < 5 && !newSuggestions.includes(suggestion)) {
          newSuggestions.push(suggestion);
        }
      });
    }

    setSuggestions(newSuggestions.slice(0, 5));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
    }
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      // Remove last assistant message if it exists
      setMessages(prev => {
        const lastAssistantIndex = prev.map(m => m.role).lastIndexOf('assistant');
        if (lastAssistantIndex > -1) {
          return prev.slice(0, lastAssistantIndex);
        }
        return prev;
      });
      
      // Resend the last user message
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    // State
    messages,
    sessions,
    currentSession,
    loading,
    error,
    suggestions,
    isTyping,
    
    // Actions
    sendMessage,
    createSession,
    deleteSession,
    loadSession,
    loadSessions,
    clearError,
    cancelRequest,
    retryLastMessage,
    
    // Helpers
    hasActiveSession: !!currentSession,
    messageCount: messages.length,
    userMessageCount: messages.filter(m => m.role === 'user').length,
    assistantMessageCount: messages.filter(m => m.role === 'assistant').length,
  };
};