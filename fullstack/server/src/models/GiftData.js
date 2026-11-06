import mongoose from 'mongoose';

// One document per user holding their whole planner:
// { settings, recipients[], occasions[], gifts[] }  (same shape as the original app)
const giftDataSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    recipients: { type: [mongoose.Schema.Types.Mixed], default: [] },
    occasions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    gifts: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, minimize: false },
);

export const GiftData = mongoose.model('GiftData', giftDataSchema);
