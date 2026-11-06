import bcrypt from 'bcryptjs';
import { createApp } from './app.js';
import { connectDb } from './db.js';
import { User } from './models/User.js';
import { jwtSecret } from './middleware/auth.js';

const DEMO = { email: 'demo@giftmemory.app', name: 'Dakshitha', password: 'demo123' };

async function ensureDemoUser() {
  if (await User.exists({ email: DEMO.email })) return;
  await User.create({ email: DEMO.email, name: DEMO.name, passwordHash: await bcrypt.hash(DEMO.password, 10) });
  console.log(`Demo account ready: ${DEMO.email} / ${DEMO.password}`);
}

try {
  jwtSecret(); // fail fast if production is missing JWT_SECRET
  await connectDb();
  await ensureDemoUser();
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}

const port = Number(process.env.PORT) || 5000;
createApp().listen(port, () => console.log(`GiftMemory API on http://localhost:${port}`));
