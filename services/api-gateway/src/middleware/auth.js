import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only if environment variables are available
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// DEMO MODE: Disable all authentication checks
const authMiddleware = async (req, res, next) => {
  req.user = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@demo.com',
    profile: {
      username: 'demouser',
      full_name: 'Demo User',
      avatar_url: null,
      role: 'user'
    }
  };
  return next();
};

export default authMiddleware;
