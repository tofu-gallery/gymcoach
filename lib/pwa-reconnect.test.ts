// Tofu: reconnecting must leave the open workout and its in-flight sends alone.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

it('disables the PWA online-event reload that can interrupt set sync', () => {
  let options: Record<string, unknown> | undefined;
  vm.runInNewContext(readFileSync('next.config.js', 'utf8'), {
    process: { env: { NODE_ENV: 'production' } },
    module: { exports: {} },
    require: (name: string) => {
      if (name === '@ducanh2912/next-pwa') return {
        default: (received: Record<string, unknown>) => {
          options = received;
          return (config: unknown) => config;
        },
      };
      if (name === 'next-intl/plugin') return () => (config: unknown) => config;
      if (name === './lib/security-headers.cjs') return { headers: () => [] };
      throw new Error(`Unexpected module ${name}`);
    },
  });
  expect(options?.reloadOnOnline).toBe(false);
});
