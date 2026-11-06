// API tests: node --test  (uses a temporary in-memory MongoDB)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDb, disconnectDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let server, base;
before(async () => {
  delete process.env.MONGODB_URI;
  await connectDb();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { server.close(); await disconnectDb(); });

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};

const sample = { settings: { yearlyBudget: 5000, theme: 'dark' }, recipients: [{ id: 'r1', name: 'Mom' }], occasions: [], gifts: [{ id: 'g1', recipientId: 'r1', name: 'Plant', status: 'idea' }] };

test('register, login, save and load data', async () => {
  const reg = await call('POST', '/auth/register', { name: 'Test', email: 'Test@Example.com', password: 'secret1' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.email, 'test@example.com');
  assert.ok(reg.body.token);

  const dup = await call('POST', '/auth/register', { name: 'X', email: 'test@example.com', password: 'secret1' });
  assert.equal(dup.status, 409);

  const bad = await call('POST', '/auth/login', { email: 'test@example.com', password: 'wrong' });
  assert.equal(bad.status, 401);

  const { body: { token } } = await call('POST', '/auth/login', { email: 'test@example.com', password: 'secret1' });
  assert.equal((await call('GET', '/auth/me', null, token)).body.user.name, 'Test');

  assert.equal((await call('GET', '/data', null, token)).body.data, null);
  assert.equal((await call('PUT', '/data', sample, token)).status, 200);
  const loaded = (await call('GET', '/data', null, token)).body.data;
  assert.deepEqual(loaded.recipients, sample.recipients);
  assert.equal(loaded.settings.theme, 'dark');
});

test('rejects bad input and missing login', async () => {
  assert.equal((await call('GET', '/data')).status, 401);
  assert.equal((await call('GET', '/data', null, 'not-a-token')).status, 401);
  assert.equal((await call('POST', '/auth/register', { name: 'A', email: 'nope', password: 'secret1' })).status, 400);
  assert.equal((await call('POST', '/auth/register', { name: 'A', email: 'a@b.co', password: '123' })).status, 400);
  const { body: { token } } = await call('POST', '/auth/register', { name: 'B', email: 'b@b.co', password: 'secret1' });
  assert.equal((await call('PUT', '/data', { recipients: 'x' }, token)).status, 400);
});

test('each user only sees their own data', async () => {
  const a = (await call('POST', '/auth/register', { name: 'A', email: 'a1@x.co', password: 'secret1' })).body.token;
  const b = (await call('POST', '/auth/register', { name: 'B', email: 'b1@x.co', password: 'secret1' })).body.token;
  await call('PUT', '/data', sample, a);
  assert.equal((await call('GET', '/data', null, b)).body.data, null);
});
