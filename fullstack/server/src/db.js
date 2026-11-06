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
  uri = uri.trim();
  if (!memoryServer) console.log(`Connecting to MongoDB: ${describeUri(uri)}`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.name}: ${err.message}`);
    console.error(`Hint: ${hintFor(err, uri)}`);
    throw new Error('Could not connect to MongoDB (see the lines above).');
  }
  console.log(`MongoDB connected (database "${mongoose.connection.name}")`);
}

// Safe summary of the connection string for the logs: never prints the password.
function describeUri(uri) {
  const m = uri.match(/^(mongodb(?:\+srv)?):\/\/(?:([^:@/]*)(?::([^@/]*))?@)?([^/?]+)(\/[^?]*)?(\?.*)?$/);
  if (!m) return `not a valid MongoDB connection string (starts with "${uri.slice(0, 14)}…")`;
  const [, scheme, user, pass, host, path, query] = m;
  const pw = pass === undefined ? 'no password' : pass.includes('<') || pass.includes('>') ? 'password still contains <db_password> placeholder' : `password set (${pass.length} chars)`;
  return `${scheme}://${user || '(no user)'}:***@${host}${path || '/'}  [${pw}; database: ${(path || '/').slice(1) || 'test (default)'}; options: ${query ? 'yes' : 'none'}]`;
}

function hintFor(err, uri) {
  const msg = `${err.name} ${err.message}`;
  if (/<db_password>|%3Cdb_password%3E/i.test(uri)) return 'replace <db_password> in MONGODB_URI with the real password (no < >).';
  if (/bad auth|authentication failed/i.test(msg)) return 'wrong username or password in MONGODB_URI. Reset the password in Atlas > Database Access and update MONGODB_URI.';
  if (/whitelist|IP.*access list|not allowed to access/i.test(msg)) return 'Atlas > Network Access must include 0.0.0.0/0.';
  if (/ENOTFOUND|querySrv|EBADNAME/i.test(msg)) return 'the cluster host name in MONGODB_URI is wrong; copy it again from Atlas > Connect > Drivers.';
  if (/Invalid scheme|URI|parse/i.test(msg)) return 'MONGODB_URI is malformed; it must start with mongodb+srv:// and be one line with no spaces.';
  if (/ServerSelection|timed out/i.test(msg)) return 'cannot reach the cluster: check Atlas > Network Access has 0.0.0.0/0 (Active) and the cluster is not paused.';
  return 'check MONGODB_URI and Atlas Network Access.';
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
