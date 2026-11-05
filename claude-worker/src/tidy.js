// Tidy a rule: turns whatever the user typed ("brush teeth two times in a
// day pls") into one short, formal, easy line that starts with one emoji.
// Only that one line of text is sent; nothing else from the app.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-5-5';

const SYSTEM = [
  'You rewrite one personal habit rule for a checklist app.',
  'Make it short (at most 8 words), formal, plain and easy to read. Keep the user\'s meaning and any numbers. Use the same language as the input.',
  'Start with exactly one fitting emoji, then a space, then the rule. No full stop at the end. No quotes.',
  'Do not mention how often (daily, weekly…): the app shows that already.',
  'Call tidy_rule once with the result.'
].join('\n');

const TOOL = {
  name: 'tidy_rule',
  description: 'Return the tidied rule.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: { rule: { type: 'string', description: 'Emoji, space, short rule.' } },
    required: ['rule'],
    additionalProperties: false
  }
};

export async function handleTidy(body, env) {
  if (!env.ANTHROPIC_API_KEY) return [500, { error: 'The server has no Anthropic API key set.' }];
  const text = typeof (body && body.text) === 'string' ? body.text.trim().slice(0, 300) : '';
  if (!text) return [400, { error: 'Nothing to tidy.' }];
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {})   // only for local testing
  });
  const messages = [{ role: 'user', content: 'Rule (' + String(body.freq || 'daily').slice(0, 10) + '): ' + text }];
  try {
    for (let round = 0; round < 2; round++) {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 1000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system: SYSTEM,
        tools: [TOOL],
        messages
      });
      if (res.stop_reason === 'refusal') return [422, { error: 'Claude declined to rewrite this.' }];
      const call = res.content.find((b) => b.type === 'tool_use' && b.name === 'tidy_rule');
      if (call && typeof call.input.rule === 'string') return [200, { rule: call.input.rule.slice(0, 120), model: res.model }];
      messages.push({ role: 'assistant', content: res.content });
      messages.push({ role: 'user', content: 'Call tidy_rule now.' });
    }
    return [502, { error: 'Claude did not finish. Try again.' }];
  } catch (err) {
    console.log('tidy error', err && err.status, String((err && err.message) || '').slice(0, 200));
    if (err instanceof Anthropic.AuthenticationError) return [502, { error: 'Anthropic rejected the API key stored on your server.' }];
    if (err instanceof Anthropic.RateLimitError) return [429, { error: 'Too many requests, or the account is out of credit.' }];
    return [502, { error: 'Claude could not be reached. Try again in a moment.' }];
  }
}
