import jwt from 'jsonwebtoken';

export const jwtSecret = () => {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
  return 'dev-only-secret-change-me';
};

export const signToken = (user) => jwt.sign({ sub: user._id.toString() }, jwtSecret(), { expiresIn: '7d' });

// Reads "Authorization: Bearer <token>" and sets req.userId.
export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try {
    req.userId = jwt.verify(token, jwtSecret()).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}
