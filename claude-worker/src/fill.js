// AI fill: reads what the user hands over (typed text, a pasted message, a
// photo or a PDF) and, when asked, searches the web for a public event by
// name, then returns the fields for one entry. Only what the user chose to
// send arrives here; the app never sends ID, bank, card or login entries.
// Claude answers by calling one strict tool, so the result always has the
// same shape; the app checks every value again before it fills a field.

import Anthropic from '@anthropic-ai/sdk';

// Claude Opus 5.5 at low effort for reading, medium when it searches the web.
const MODEL = 'claude-opus-5-5';
const MAX_TEXT = 20000;
const MAX_FILES = 4;
const MAX_FILE_B64 = 7 * 1024 * 1024;        // about 5 MB of image or PDF
const FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_ROUNDS = 5;                         // server-tool pauses plus one nudge

const SYSTEM = [
  'You fill in one record in Deposit Box, a personal organiser used by one person in Kerala, India.',
  'You get: the kinds of record the app has, each with its fields; and what the user gave you (text, photos, PDFs), and sometimes permission to search the web.',
  'Pick the one kind that fits best, then fill only the fields you can support from what you were given or found. Leave a field out rather than guess.',
  'Formats: dates as YYYY-MM-DD; times as 24-hour HH:MM (India time); amounts and numbers as plain digits without ₹ or commas; for a field with options, use exactly one of its options.',
  'title: a short, clear name for the record (for a race, the event name; for an exam, the exam and year; for a ticket, from → to).',
  'When you search the web, prefer the official site of the event or organisation, check the year and edition match, and put the pages you used in sources. If the date is not announced yet, say so in note instead of guessing.',
  'note: one or two short sentences for the user: anything uncertain, or what they should check. Empty if nothing.',
  'Never put passwords, PINs, card numbers or Aadhaar numbers in any field, even if they appear in the input.',
  'When you are done, call fill_entry exactly once.'
].join('\n');

function fillTool(kindKeys) {
  return {
    name: 'fill_entry',
    description: 'Return the filled record. Call this once, at the end.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: kindKeys, description: 'The kind of record.' },
        title: { type: 'string' },
        fields: {
          type: 'array',
          description: 'Only the fields you could fill.',
          items: {
            type: 'object',
            properties: { key: { type: 'string' }, value: { type: 'string' } },
            required: ['key', 'value'],
            additionalProperties: false
          }
        },
        sources: { type: 'array', items: { type: 'string' }, description: 'URLs of pages used, if you searched.' },
        note: { type: 'string' }
      },
      required: ['kind', 'title', 'fields', 'sources', 'note'],
      additionalProperties: false
    }
  };
}

function cleanKinds(kinds) {
  if (!Array.isArray(kinds) || !kinds.length || kinds.length > 60) return null;
  const out = [];
  for (const k of kinds) {
    if (!k || typeof k.k !== 'string' || !/^[a-z0-9_]{2,20}$/.test(k.k) || !Array.isArray(k.fields)) return null;
    out.push({
      k: k.k,
      name: String(k.name || k.k).slice(0, 60),
      fields: k.fields.slice(0, 30).filter((f) => f && /^[a-z0-9_]{1,20}$/.test(f.k)).map((f) => ({
        k: f.k, label: String(f.l || '').slice(0, 60),
        ...(f.t ? { type: String(f.t).slice(0, 10) } : {}),
        ...(Array.isArray(f.opts) ? { options: f.opts.slice(0, 30).map((o) => String(o).slice(0, 60)) } : {})
      }))
    });
  }
  return out;
}

export async function handleFill(body, env) {
  if (!env.ANTHROPIC_API_KEY) return [500, { error: 'The server has no Anthropic API key set.' }];
  const kinds = cleanKinds(body && body.kinds);
  if (!kinds) return [400, { error: 'Bad list of record kinds.' }];
  const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT) : '';
  const files = Array.isArray(body.files) ? body.files : [];
  if (files.length > MAX_FILES) return [413, { error: 'Send at most ' + MAX_FILES + ' files at a time.' }];
  for (const f of files) {
    if (!f || !FILE_TYPES.includes(f.type) || typeof f.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(f.data)) return [400, { error: 'Only photos (JPEG, PNG, WebP) and PDFs can be read.' }];
    if (f.data.length > MAX_FILE_B64) return [413, { error: 'That file is too big. Keep it under 5 MB.' }];
  }
  if (!text.trim() && !files.length) return [400, { error: 'Give me some text, a photo or a PDF to read.' }];
  const web = !!body.web;
  const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);

  const content = files.map((f) => f.type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } }
    : { type: 'image', source: { type: 'base64', media_type: f.type, data: f.data } });
  content.push({
    type: 'text',
    text: 'Today is ' + today + '.\n\nKinds of record (JSON):\n' + JSON.stringify(kinds) +
      (body.kind ? '\n\nThe user has this kind open already: ' + String(body.kind).slice(0, 20) + ' (use it unless the input clearly is something else).' : '') +
      '\n\n' + (web ? 'You may search the web for the official details.' : 'Do not search; use only what is attached or written below.') +
      '\n\nFrom the user:\n' + (text.trim() || '(see the attached file' + (files.length > 1 ? 's' : '') + ')')
  });

  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {})   // only for local testing
  });
  const tools = [fillTool(kinds.map((k) => k.k))];
  if (web) tools.push({ type: 'web_search_20260209', name: 'web_search', max_uses: 5 });
  const messages = [{ role: 'user', content }];
  let usage = { input: 0, output: 0, searches: 0 };

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        // If Claude declines, Anthropic retries on its recommended model in the same call.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: web ? 'medium' : 'low' },
        system: SYSTEM,
        tools,
        messages
      });
      usage.input += res.usage.input_tokens || 0;
      usage.output += res.usage.output_tokens || 0;
      usage.searches += (res.usage.server_tool_use && res.usage.server_tool_use.web_search_requests) || 0;
      if (res.stop_reason === 'refusal') return [422, { error: 'Claude declined to read this.' }];
      const call = res.content.find((b) => b.type === 'tool_use' && b.name === 'fill_entry');
      if (call) return [200, { ...call.input, model: res.model, usage }];
      // A long search pauses the turn; send it back and the server carries on.
      messages.push({ role: 'assistant', content: res.content });
      if (res.stop_reason === 'pause_turn') continue;
      if (res.stop_reason === 'max_tokens') return [502, { error: 'Claude’s answer ran too long. Try with less text.' }];
      messages.push({ role: 'user', content: 'Call fill_entry now with what you have.' });
    }
    return [502, { error: 'Claude did not finish. Try again.' }];
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return [502, { error: 'Anthropic rejected the API key stored on your server.' }];
    if (err instanceof Anthropic.PermissionDeniedError) return [502, { error: 'Your Anthropic account is not allowed to use this model.' }];
    if (err instanceof Anthropic.RateLimitError) return [429, { error: 'Too many requests, or the account is out of credit. Wait a minute and try again.' }];
    if (err instanceof Anthropic.BadRequestError) return [502, { error: 'Anthropic rejected the request: ' + err.message }];
    if (err instanceof Anthropic.APIError) return [502, { error: 'Anthropic error ' + (err.status || '') + '. Try again in a moment.' }];
    return [502, { error: 'Claude could not be reached. Try again in a moment.' }];
  }
}
