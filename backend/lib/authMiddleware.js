/**
 * JWT Authentication Middleware.
 * Verifies the Bearer token and attaches decoded user info to req.user.
 * 
 * Usage:
 *   const { authenticate, optionalAuth } = require('../lib/authMiddleware');
 *   router.get('/protected', authenticate, handler);
 *   router.get('/public-with-context', optionalAuth, handler);
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'alumnex_secret_2026';

// Log warning at startup if using fallback secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  [Auth] JWT_SECRET not set — using insecure fallback. Set JWT_SECRET in production!');
}

/**
 * Strict auth — rejects request if no valid token.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, name }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Optional auth — attaches user if token present, but allows unauthenticated requests.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Token invalid — proceed without user context
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = { authenticate, optionalAuth };
