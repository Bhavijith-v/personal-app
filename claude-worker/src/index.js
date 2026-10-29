// Deposit Box - Claude proxy (Cloudflare Worker).
//
// The app is public, client-side code, so it can't hold an Anthropic API
// key. This worker holds it instead and forwards only what the app sends:
// the runner's races and runs, and the chat. Requests are accepted only from
// the app's own origin and with the shared access token, request size and
// answer length are capped, and Claude's reply streams back as one JSON
// object per line: {t:"text",v} pieces, then {t:"done",stop,model,usage}
// or {t:"error",v}.

import Anthropic from '@anthropic-ai/sdk';
import { handlePush, runPushes } from './push.js';

// Sonnet 5.5: strong enough for training plans at half Opus's price.
// Change to 'claude-opus-5-5' for the most capable model ($4/$20 per MTok).
const MODEL = 'claude-sonnet-5-5';
// Anthropic suggests low effort for chat on Sonnet 5.5: less thinking, lower cost.
const EFFORT = 'low';
const MAX_OUTPUT = 8000;   // about 6,000 words: plenty for a plan, and caps one answer's cost
const MAX_TURNS = 40;
const MAX_CHARS = 60000;   // chat + runner data, all turns together

const COACH = [
  'You are a running coach inside Deposit Box, a personal app, talking with one recreational runner in Kerala, India.',
  "You get the runner's races, personal bests and recent training from the app. Base your advice on that data and say when something you'd need is missing.",
  'Use kilometres and min/km paces. Allow for Kerala heat and humidity, and for races that start at 4:30 to 6 am.',
  'Be specific and practical: target paces, weekly structure, long runs, taper, race-day plan. Keep answers short and easy to scan, with short lists where they help.',
  'If something sounds like an injury or a medical problem, suggest seeing a doctor or physiotherapist instead of diagnosing it.'
].join('\n');

function corsFor(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  const headers = { Vary: 'Origin' };
  if (ok) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return { ok, headers };
}

// Compare without leaking how many leading characters matched.
function sameSecret(a, b) {
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function reply(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function validTurns(msgs) {
  return Array.isArray(msgs) && msgs.length >= 1 && msgs.length <= MAX_TURNS &&
    msgs.every((m, i) => m && m.role === (i % 2 ? 'assistant' : 'user') &&
      typeof m.content === 'string' && m.content.trim().length > 0) &&
    msgs[msgs.length - 1].role === 'user';
}

export default {
  async fetch(request, env, ctx) {
    const cors = corsFor(request.headers.get('Origin') || '', env);
    if (request.method === 'OPTIONS') return new Response(null, { status: cors.ok ? 204 : 403, headers: cors.headers });
    if (!cors.ok) return reply(403, { error: 'This server only answers the Deposit Box app.' }, cors.headers);
    if (request.method !== 'POST') return reply(405, { error: 'POST only.' }, cors.headers);

    // Reminder notifications need no access token: they hold only a push
    // address and some times, never anything from the box.
    const path = new URL(request.url).pathname;
    if (path.startsWith('/push/')) {
      let pbody;
      try { pbody = await request.json(); } catch { return reply(400, { error: 'Request was not JSON.' }, cors.headers); }
      const [status, out] = await handlePush(path, pbody, env);
      return reply(status, out, cors.headers);
    }

    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!env.APP_TOKEN || !sameSecret(token, env.APP_TOKEN)) return reply(401, { error: 'Wrong access token.' }, cors.headers);
    if (!env.ANTHROPIC_API_KEY) return reply(500, { error: 'The server has no Anthropic API key set.' }, cors.headers);

    let body;
    try { body = await request.json(); } catch { return reply(400, { error: 'Request was not JSON.' }, cors.headers); }
    if (body && body.ping) return reply(200, { ok: true, model: MODEL }, cors.headers);

    const msgs = body && body.messages;
    const context = typeof (body && body.context) === 'string' ? body.context : '';
    if (!validTurns(msgs)) return reply(400, { error: 'Messages must alternate user and assistant, ending with the user.' }, cors.headers);
    const size = context.length + msgs.reduce((n, m) => n + m.content.length, 0);
    if (size > MAX_CHARS) return reply(413, { error: 'This chat is too long. Start a new one.' }, cors.headers);

    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {})   // only for local testing
    });

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const send = (obj) => writer.write(enc.encode(JSON.stringify(obj) + '\n'));

    const run = async () => {
      try {
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: MAX_OUTPUT,
          // If Claude declines, Anthropic retries on its recommended model
          // inside the same call (for Sonnet 5.5, the "default" form only). A
          // mid-answer switch continues the partial text, so nothing already
          // streamed has to be discarded.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: EFFORT },
          cache_control: { type: 'ephemeral' },   // reuse the prefix across turns of one chat
          system: [
            { type: 'text', text: COACH },
            { type: 'text', text: "The runner's data, shared from their app:\n\n" + (context || '(none shared)') }
          ],
          messages: msgs.map((m) => ({ role: m.role, content: m.content }))
        });
        for await (const ev of stream) {
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') await send({ t: 'text', v: ev.delta.text });
        }
        const final = await stream.finalMessage();
        await send({
          t: 'done',
          stop: final.stop_reason,
          model: final.model,
          usage: {
            input: final.usage.input_tokens,
            output: final.usage.output_tokens,
            cacheRead: final.usage.cache_read_input_tokens || 0,
            cacheWrite: final.usage.cache_creation_input_tokens || 0
          }
        });
      } catch (err) {
        let msg = 'Claude could not answer right now. Try again in a moment.';
        if (err instanceof Anthropic.AuthenticationError) msg = 'Anthropic rejected the API key stored on your server.';
        else if (err instanceof Anthropic.PermissionDeniedError) msg = 'Your Anthropic account is not allowed to use this model.';
        else if (err instanceof Anthropic.RateLimitError) msg = 'Too many requests, or the account is out of credit. Wait a minute and try again.';
        else if (err instanceof Anthropic.BadRequestError) msg = 'Anthropic rejected the request: ' + err.message;
        else if (err instanceof Anthropic.APIError) msg = 'Anthropic error ' + (err.status || '') + '. Try again in a moment.';
        await send({ t: 'error', v: msg }).catch(() => {});
      } finally {
        await writer.close().catch(() => {});
      }
    };
    if (ctx && ctx.waitUntil) ctx.waitUntil(run()); else run();

    return new Response(readable, {
      headers: { ...cors.headers, 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  },

  // Every 15 minutes: send the reminder notifications that have come due.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runPushes(env));
  }
};
