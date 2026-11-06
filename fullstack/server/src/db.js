import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';

let memoryServer = null;

// Connects to MongoDB Atlas when MONGODB_URI is set; otherwise starts a
// throwaway in-memory MongoDB so the app can be tried with no setup.
export async function connectDb() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production');
    // Keep the downloaded test MongoDB inside server/node_modules, whatever folder we start from.
    process.env.MONGOMS_DOWNLOAD_DIR ||= fileURLToPath(new URL('../node_modules/.cache/mongodb-memory-server', import.meta.url));
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('MONGODB_URI not set: using a temporary in-memory database (data is lost on restart).');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
