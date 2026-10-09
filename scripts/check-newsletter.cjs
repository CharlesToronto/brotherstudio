// Run with node scripts/check-newsletter.cjs. Tests API boundaries without credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let authorized = false, allowed = true, writes = [], reads = 0;
const db = { from: () => ({
  upsert: async (row, options) => { writes.push({ row, options }); return { error: null }; },
  select: () => { reads++; return { order: () => ({ order: () => ({ range: async (start, end) => ({ data: [], count: 0, error: null, start, end }) }) }) }; }
}) };
const moduleObject = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/app/api/estate/newsletter/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { module: moduleObject, exports: moduleObject.exports, URL, require: id => {
  if (id === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200, headers: options?.headers }) } };
  if (id.endsWith('adminSession')) return { hasAdminSession: async () => authorized };
  if (id.endsWith('supabase/server')) return { getSupabaseAdminClient: () => db };
  if (id.endsWith('estateServer')) return { estateRateLimit: async () => allowed, estateSameOrigin: req => req.headers.get('origin') === 'https://example.test' };
  throw new Error(id);
} });
const { GET, POST } = moduleObject.exports;
const request = (body, origin = 'https://example.test') => new Request('https://example.test/api/estate/newsletter', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
(async () => {
  const valid = { email: ' Test@Example.com ', locale: 'fr', consent: true };
  assert.equal((await GET(new Request('https://example.test/api/estate/newsletter'))).status, 401);
  assert.equal(reads, 0);
  assert.equal((await POST(request(valid, 'https://other.test'))).status, 403);
  for (const body of [{ ...valid, email: 'bad' }, { ...valid, consent: false }, { ...valid, locale: 'xx' }, null]) assert.equal((await POST(request(body))).status, 400);
  assert.equal((await POST(request({ ...valid, website: 'spam' }))).status, 200);
  assert.equal(writes.length, 0);
  allowed = false; assert.equal((await POST(request(valid))).status, 429);
  allowed = true; assert.equal((await POST(request(valid))).status, 200);
  assert.equal(writes[0].row.email, 'test@example.com'); assert.equal(writes[0].options.ignoreDuplicates, true);
  authorized = true;
  assert.equal((await GET(new Request('https://example.test/api/estate/newsletter?offset=-1'))).status, 400);
  const response = await GET(new Request('https://example.test/api/estate/newsletter?offset=50'));
  assert.equal(response.status, 200); assert.equal(response.headers['Cache-Control'], 'private, no-store');
  console.log('Newsletter API checks passed: admin access, origin, validation, consent, honeypot, rate limit, normalization and pagination.');
})().catch(error => { console.error(error); process.exitCode = 1; });
