import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';

export const authRouter = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP.
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' } });

const EMAIL = /^\S+@\S+\.\S+$/;

authRouter.post('/register', limiter, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!name) return res.status(400).json({ error: 'Enter your name', field: 'name' });
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email', field: 'email' });
    if (password.length < 6) return res.status(400).json({ error: 'Use at least 6 characters', field: 'password' });
    if (await User.exists({ email })) return res.status(409).json({ error: 'That email is already registered. Log in instead.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  } catch (e) { next(e); }
});

authRouter.post('/login', limiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (e) { next(e); }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Please log in.' });
    res.json({ user: user.toPublic() });
  } catch (e) { next(e); }
});
