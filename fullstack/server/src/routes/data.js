import { Router } from 'express';
import { GiftData } from '../models/GiftData.js';
import { requireAuth } from '../middleware/auth.js';

export const dataRouter = Router();
dataRouter.use(requireAuth);

const LIMITS = { recipients: 500, occasions: 2000, gifts: 5000 };

// GET /api/data -> the user's planner, or { data: null } if they have none yet.
dataRouter.get('/', async (req, res, next) => {
  try {
    const doc = await GiftData.findOne({ user: req.userId }).lean();
    if (!doc) return res.json({ data: null });
    const { settings, recipients, occasions, gifts, updatedAt } = doc;
    res.json({ data: { settings, recipients, occasions, gifts }, updatedAt });
  } catch (e) { next(e); }
});

// PUT /api/data -> replace the user's planner with the body.
dataRouter.put('/', async (req, res, next) => {
  try {
    const d = req.body || {};
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    if (!isObj(d.settings) || !Array.isArray(d.recipients) || !Array.isArray(d.occasions) || !Array.isArray(d.gifts)) {
      return res.status(400).json({ error: 'This isn’t valid GiftMemory data.' });
    }
    for (const [k, max] of Object.entries(LIMITS)) {
      if (d[k].length > max) return res.status(400).json({ error: `Too many ${k} (limit ${max}).` });
      if (!d[k].every(isObj)) return res.status(400).json({ error: `Every item in ${k} must be an object.` });
    }
    const doc = await GiftData.findOneAndUpdate(
      { user: req.userId },
      { settings: d.settings, recipients: d.recipients, occasions: d.occasions, gifts: d.gifts },
      { upsert: true, new: true, runValidators: true },
    );
    res.json({ ok: true, updatedAt: doc.updatedAt });
  } catch (e) { next(e); }
});

// DELETE /api/data -> remove all the user's planner data.
dataRouter.delete('/', async (req, res, next) => {
  try {
    await GiftData.deleteOne({ user: req.userId });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
