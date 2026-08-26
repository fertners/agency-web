import { describe, expect, it } from 'vitest';

import {
  LocalAIProvider,
  OllamaAIProvider,
  OpenAIProvider,
  createAIProviderFromEnvironment,
} from '../src/index.js';

describe('AI provider factory', () => {
  it('uses the deterministic local provider by default', () => {
    expect(createAIProviderFromEnvironment({})).toBeInstanceOf(LocalAIProvider);
  });

  it('builds the OpenAI provider only with an explicit key', () => {
    const provider = createAIProviderFromEnvironment({
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'test-model',
    });
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.model).toBe('test-model');
  });

  it('builds the local Ollama provider without an API key', () => {
    const provider = createAIProviderFromEnvironment({
      AI_PROVIDER: 'ollama',
      OLLAMA_BASE_URL: 'http://127.0.0.1:11434/',
      OLLAMA_MODEL: 'gemma3:4b',
    });
    expect(provider).toBeInstanceOf(OllamaAIProvider);
    expect(provider.model).toBe('gemma3:4b');
    expect(provider.supportsVision).toBe(true);
  });

  it('fails fast when OpenAI is selected without a key', () => {
    expect(() =>
      createAIProviderFromEnvironment({ AI_PROVIDER: 'openai' }),
    ).toThrow('OPENAI_API_KEY');
  });
});
