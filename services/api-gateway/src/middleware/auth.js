const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // Not found is ok for new users
      console.error('Error fetching user profile:', profileError);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      profile: profile || null
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

module.exports = authMiddleware;
