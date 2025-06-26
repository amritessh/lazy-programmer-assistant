import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get all chat sessions for user
router.get(
  '/sessions',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { data: sessions, error, count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: sessions,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chat sessions'
      });
    }
  }
);

// Create new chat session
router.post(
  '/sessions',
  body('title').optional().isString().trim().isLength({ max: 200 }),
  body('projectId').optional().isUUID(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, projectId } = req.body;

      // Verify project belongs to user if projectId provided
      if (projectId) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .eq('user_id', req.user.id)
          .single();

        if (projectError || !project) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }
      }

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: req.user.id,
          title: title || 'New Chat',
          project_id: projectId || null
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data: session,
        message: 'Chat session created successfully'
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat session'
      });
    }
  }
);

// Get messages for a chat session
router.get(
  '/sessions/:sessionId/messages',
  param('sessionId').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Verify session belongs to user
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', req.user.id)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }

      const { data: messages, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: messages,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }
  }
);

// Send message (main chat endpoint)
router.post(
  '/sessions/:sessionId/messages',
  param('sessionId').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 10000 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;

      // Verify session belongs to user
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', req.user.id)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }

      // Save user message
      const { data: userMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: content,
          metadata: {
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Get project context if available
      let projectContext = null;
      if (session.project_id) {
        try {
          const contextResponse = await axios.post(
            `http://localhost:${process.env.CONTEXT_SERVICE_PORT ||
              3002}/analyze`,
            { projectId: session.project_id },
            {
              headers: {
                'X-User-ID': req.user.id,
                'Content-Type': 'application/json'
              }
            }
          );
          projectContext = contextResponse.data.data;
        } catch (contextError) {
          console.error(
            'Error fetching project context:',
            contextError.message
          );
        }
      }

      // Process message with AI service
      try {
        const aiResponse = await axios.post(
          `http://localhost:${process.env.AI_SERVICE_PORT || 3003}/process`,
          {
            message: content,
            context: projectContext,
            sessionId: sessionId,
            userId: req.user.id
          },
          {
            headers: {
              'X-User-ID': req.user.id,
              'Content-Type': 'application/json'
            }
          }
        );

        const aiResult = aiResponse.data.data;

        // Save AI response
        const { data: assistantMessage, error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: aiResult.response,
            metadata: {
              timestamp: new Date().toISOString(),
              assumptions: aiResult.assumptions || [],
              codeGenerated: aiResult.codeGenerated || false,
              confidence: aiResult.confidence || null,
              context: projectContext ? { projectId: session.project_id } : null
            }
          })
          .select()
          .single();

        if (aiMessageError) throw aiMessageError;

        // Update session updated_at
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId);

        res.json({
          success: true,
          data: {
            userMessage,
            assistantMessage
          },
          message: 'Message processed successfully'
        });
      } catch (aiError) {
        console.error('AI service error:', aiError.message);

        // Save error response
        const { data: errorMessage } = await supabase
          .from('messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content:
              "Sorry, I'm having trouble processing your request right now. Please try again in a moment.",
            metadata: {
              timestamp: new Date().toISOString(),
              error: true
            }
          })
          .select()
          .single();

        res.json({
          success: true,
          data: {
            userMessage,
            assistantMessage: errorMessage
          },
          message: 'Message saved, but AI processing failed'
        });
      }
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      });
    }
  }
);

// Delete chat session
router.delete(
  '/sessions/:sessionId',
  param('sessionId').isUUID(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Verify session belongs to user
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', req.user.id)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }

      // Delete messages first (cascade should handle this, but being explicit)
      await supabase.from('messages').delete().eq('session_id', sessionId);

      // Delete session
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Chat session deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chat session'
      });
    }
  }
);

export default router;
