import { describe, expect, it } from 'vitest';

import {
  LocalAIProvider,
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

  it('fails fast when OpenAI is selected without a key', () => {
    expect(() =>
      createAIProviderFromEnvironment({ AI_PROVIDER: 'openai' }),
    ).toThrow('OPENAI_API_KEY');
  });
});
