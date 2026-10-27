import { AnthropicProvider } from './anthropic';
import { CodexLbProvider } from './codex-lb';
import { OpenRouterProvider } from './openrouter';
import { DemoProvider } from './demo';
import type { LlmProvider } from './types';

export * from './types';
export type LlmProviderId = LlmProvider['id'];

// Reads LLM_PROVIDER (case-insensitive). Defaults to 'anthropic'; an
// unrecognized value also falls back to 'anthropic'. 'demo' serves canned
// responses (no key needed), useful to try the AI screens.
// Tofu: with LLM_PROVIDER unset, an owner who saved only OPENROUTER_API_KEY
// gets OpenRouter, so either key alone turns the coach on (see TOFU.md).
export function resolveProviderId(): LlmProviderId {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (raw === 'codex-lb' || raw === 'codex_lb' || raw === 'codexlb') return 'codex-lb';
  if (raw === 'openrouter') return 'openrouter';
  if (raw === 'demo') return 'demo';
  if (!raw && !process.env.ANTHROPIC_API_KEY?.trim() && process.env.OPENROUTER_API_KEY?.trim()) {
    return 'openrouter';
  }
  return 'anthropic';
}

export function getLlmProvider(): LlmProvider {
  const id = resolveProviderId();
  if (id === 'codex-lb') return new CodexLbProvider();
  if (id === 'openrouter') return new OpenRouterProvider();
  if (id === 'demo') return new DemoProvider();
  return new AnthropicProvider();
}
