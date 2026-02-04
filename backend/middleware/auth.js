import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  console.log('[AUTH] Request to:', req.path);
  console.log('[AUTH] Authorization header present:', !!authHeader);
  console.log('[AUTH] Token extracted:', !!token);

  if (!token) {
    console.log('[AUTH] ❌ NO TOKEN PROVIDED');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    console.log('[AUTH] Verifying token with JWT_SECRET...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    console.log('[AUTH] ✅ Token verified for user:', decoded.id);
    next();
  } catch (error) {
    console.log('[AUTH] ❌ Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
