// Tofu: reconnecting must leave the open workout and its in-flight sends alone.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('disables the PWA online-event reload that can interrupt set sync', () => {
  const config = readFileSync('next.config.js', 'utf8');
  expect(config).toMatch(/\breloadOnOnline:\s*false\b/);
});
