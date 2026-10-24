const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in dependencies ? dependencies[name] : require(name), URL, Request, Response, AbortSignal, console, ...globals }, { filename: file });
  return exports;
}
(async () => {
  const calls = [];
  const document = { cookie: '' };
  const window = { location: { pathname: '/fr/contact' }, fbq: (...args) => calls.push(args) };
  let response = { ok: true, metaEventId: 'lead-123', metaFormName: 'contact' };
  const pixel = load('src/lib/metaPixel.ts', { '@/lib/analyticsPreference': { ANALYTICS_EXCLUSION_COOKIE: 'bs_analytics_disabled' } }, {
    process: { env: { NODE_ENV: 'production' } }, window, document,
    fetch: async () => Response.json(response),
  });
  await pixel.submitTrackedContact({});
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'Lead');
  assert.equal(calls[0][3].eventID, 'lead-123');
  response = { ok: true }; // Honeypot is not a lead.
  await pixel.submitTrackedContact({});
  assert.equal(calls.length, 1);
  document.cookie = 'bs_analytics_disabled=1';
  pixel.trackMeta('Lead');
  assert.equal(calls.length, 1);
  document.cookie = '';
  window.location.pathname = '/fr/team/client';
  pixel.trackMeta('ContactClick');
  assert.equal(calls.length, 1);
  for (const path of ['/admin', '/fr/dashboard', '/en/myreview/private', '/fr/team/client']) assert.equal(pixel.isPublicTrackingPath(path), false);

  const deliveries = [];
  const server = load('src/lib/metaConversions.ts', {
    '@/lib/analyticsPreference': { ANALYTICS_EXCLUSION_COOKIE: 'bs_analytics_disabled' },
    '@/lib/metaPixel': pixel,
  }, { process: { env: { NODE_ENV: 'production', META_CONVERSIONS_ACCESS_TOKEN: 'test-only', META_GRAPH_API_VERSION: 'v25.0' } },
    fetch: async (url, init) => { deliveries.push(JSON.parse(init.body)); return { ok: true }; },
  });
  const request = (cookie = '') => new Request('https://example.com/api/contact', { headers: { referer: 'https://example.com/fr/contact?email=secret#test', cookie, 'user-agent': 'test' } });
  await server.sendMetaLead(request(), { eventId: 'lead-123', formName: 'contact', email: ' PERSON@example.com ' });
  assert.equal(deliveries.length, 1);
  const event = deliveries[0].data[0];
  assert.equal(event.event_id, 'lead-123');
  assert.equal(event.event_source_url, 'https://example.com/fr/contact');
  assert.match(event.user_data.em[0], /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(event).includes('PERSON'), false);
  await server.sendMetaLead(request('bs_analytics_disabled=1'), { eventId: 'excluded', formName: 'contact', email: 'a@b.com' });
  assert.equal(deliveries.length, 1);

  const background = [];
  const route = load('src/app/api/contact/route.ts', {
    'next/server': { NextResponse: Response, after: callback => background.push(callback) },
    '@/content/site': { site: { contact: { email: 'owner@example.com' } } },
    '@/lib/supabase/server': { getSupabaseAdminClient: () => { throw new Error('Unexpected database call'); } },
    '@/lib/metaConversions': { sendMetaLead: async () => {} },
  }, { process: { env: { RESEND_API_KEY: 'test-only' } }, fetch: async () => Response.json({ id: 'email' }) });
  const post = body => route.POST(new Request('https://example.com/api/contact', { method: 'POST', body: JSON.stringify(body) }));
  assert.equal((await post({})).status, 400);
  assert.equal((await (await post({ website: 'bot' })).json()).metaEventId, undefined);
  assert.equal(background.length, 0);
  const result = await (await post({ name: 'Test', email: 'test@example.com', message: 'Private message' })).json();
  assert.equal(result.ok, true);
  assert.equal(typeof result.metaEventId, 'string');
  assert.equal(background.length, 1);
  console.log('Meta tracking checks passed: confirmed leads, honeypot, exclusions, deduplication ID, hashed email, URL filtering, contact API.');
})().catch(error => { console.error(error); process.exitCode = 1; });
