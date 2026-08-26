import {
  websiteVersionResponseSchema,
  type WebsiteVersionResponse,
} from '@ai-web-agency/shared';

function getApiUrl(): string {
  return process.env.API_URL ?? 'http://127.0.0.1:3001';
}

export async function getWebsiteVersion(
  websiteId: string,
  versionId: string,
): Promise<WebsiteVersionResponse | undefined> {
  const response = await fetch(
    `${getApiUrl()}/websites/${encodeURIComponent(websiteId)}/versions/${encodeURIComponent(versionId)}`,
    { cache: 'no-store' },
  );
  if (response.status === 404) return undefined;
  if (!response.ok)
    throw new Error(`Preview API request failed with ${response.status}`);
  const body: unknown = await response.json();
  return websiteVersionResponseSchema.parse(body);
}
