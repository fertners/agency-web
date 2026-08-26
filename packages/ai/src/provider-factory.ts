import type { AIProvider } from './types.js';
import { LocalAIProvider } from './local-provider.js';
import { OllamaAIProvider } from './ollama-provider.js';
import { OpenAIProvider } from './openai-provider.js';

export type AIProviderEnvironment = Readonly<{
  AI_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
}>;

export function createAIProviderFromEnvironment(
  environment: AIProviderEnvironment = {},
): AIProvider {
  const provider = environment.AI_PROVIDER?.trim().toLocaleLowerCase('en-US');
  if (provider === undefined || provider === '' || provider === 'local')
    return new LocalAIProvider();
  if (provider === 'ollama')
    return new OllamaAIProvider({
      baseUrl: environment.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434',
      model: environment.OLLAMA_MODEL?.trim() || 'gemma3:4b',
    });
  if (provider !== 'openai')
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);

  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (apiKey === undefined || apiKey === '')
    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');

  return new OpenAIProvider({
    apiKey,
    model: environment.OPENAI_MODEL?.trim() || 'gpt-5.4-mini',
  });
}
