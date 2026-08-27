import type {
  DeploymentEnvironment,
  DeploymentProvider,
} from '@ai-web-agency/shared';
import type { WebsiteRepository } from '@ai-web-agency/database';
import { renderStaticRestaurantDocument } from '@ai-web-agency/websites/static-renderer';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { z } from 'zod';

export interface DeploymentService {
  readonly name: DeploymentProvider;
  deploy(input: {
    websiteId: string;
    versionId: string;
    environment: DeploymentEnvironment;
  }): Promise<{ url: string }>;
}

export class LocalDeploymentProvider implements DeploymentService {
  readonly name = 'local-preview' as const;
  constructor(private readonly previewBaseUrl = 'http://127.0.0.1:3002') {}
  deploy(input: { websiteId: string; versionId: string }) {
    return Promise.resolve({
      url: `${this.previewBaseUrl}/preview/${input.websiteId}/${input.versionId}`,
    });
  }
}

const cloudflareEnvelopeSchema = z
  .object({
    success: z.boolean(),
    errors: z
      .array(z.object({ message: z.string() }).passthrough())
      .default([]),
  })
  .passthrough();

const cloudflarePagesEnvironmentSchema = z
  .object({
    CLOUDFLARE_API_TOKEN: z.string().trim().min(20),
    CLOUDFLARE_ACCOUNT_ID: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{32}$/),
    CLOUDFLARE_PAGES_PROJECT_PREFIX: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]{1,29}$/)
      .default('agency-site'),
  })
  .strict();

type CloudflarePagesEnvironment = z.infer<
  typeof cloudflarePagesEnvironmentSchema
>;

const runFile = promisify(execFile);

export class CloudflarePagesDeploymentProvider implements DeploymentService {
  readonly name = 'cloudflare-pages' as const;

  constructor(
    private readonly websites: Pick<WebsiteRepository, 'findVersion'>,
    private readonly environment: CloudflarePagesEnvironment,
  ) {}

  async deploy(input: {
    websiteId: string;
    versionId: string;
    environment: DeploymentEnvironment;
  }): Promise<{ url: string }> {
    const version = await this.websites.findVersion(
      input.websiteId,
      input.versionId,
    );
    if (version === undefined) throw new Error('Website version not found');

    const projectName = this.projectName(input.websiteId);
    await this.ensureProject(projectName);
    const canonicalUrl = `https://${projectName}.pages.dev`;
    const stylesheetPath = fileURLToPath(
      import.meta.resolve('@ai-web-agency/websites/styles.css'),
    );
    const stylesheet = await readFile(stylesheetPath, 'utf8');
    const document = renderStaticRestaurantDocument(version.config, {
      canonicalUrl,
      stylesheet,
    });
    const outputDirectory = await mkdtemp(
      join(tmpdir(), 'ai-web-agency-cloudflare-'),
    );
    try {
      await writeFile(join(outputDirectory, 'index.html'), document, 'utf8');
      await writeFile(
        join(outputDirectory, '_headers'),
        '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n',
        'utf8',
      );
      const branch =
        input.environment === 'PRODUCTION'
          ? 'main'
          : `preview-${input.versionId.slice(0, 8)}`;
      const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
      const { stdout, stderr } = await runFile(
        executable,
        [
          'exec',
          'wrangler',
          'pages',
          'deploy',
          outputDirectory,
          `--project-name=${projectName}`,
          `--branch=${branch}`,
          '--commit-dirty=false',
          `--commit-hash=${input.versionId.replaceAll('-', '')}`,
          `--commit-message=Website version ${input.versionId}`,
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: this.environment.CLOUDFLARE_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: this.environment.CLOUDFLARE_ACCOUNT_ID,
            WRANGLER_LOG_PATH: join(outputDirectory, 'wrangler.log'),
            WRANGLER_SEND_METRICS: 'false',
          },
          maxBuffer: 1024 * 1024,
        },
      );
      const match = `${stdout}\n${stderr}`.match(
        /https:\/\/[a-zA-Z0-9.-]+\.pages\.dev\/?/,
      );
      if (match === null)
        throw new Error('Cloudflare deployment completed without a public URL');
      return { url: match[0].replace(/\/$/, '') };
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  }

  private projectName(websiteId: string): string {
    return `${this.environment.CLOUDFLARE_PAGES_PROJECT_PREFIX}-${websiteId.replaceAll('-', '').slice(0, 12)}`;
  }

  private async ensureProject(projectName: string): Promise<void> {
    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.environment.CLOUDFLARE_ACCOUNT_ID}/pages/projects`;
    const headers = {
      Authorization: `Bearer ${this.environment.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    };
    const existing = await fetch(`${baseUrl}/${projectName}`, { headers });
    if (existing.ok) return;
    if (existing.status !== 404)
      throw new Error(await this.cloudflareError(existing));
    const created = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: projectName, production_branch: 'main' }),
    });
    if (!created.ok) throw new Error(await this.cloudflareError(created));
  }

  private async cloudflareError(response: Response): Promise<string> {
    const body: unknown = await response.json().catch(() => undefined);
    const parsed = cloudflareEnvelopeSchema.safeParse(body);
    const detail = parsed.success
      ? parsed.data.errors.map((error) => error.message).join('; ')
      : `HTTP ${response.status}`;
    return `Cloudflare Pages request failed: ${detail || `HTTP ${response.status}`}`;
  }
}

export function createDeploymentProvider(
  websites: Pick<WebsiteRepository, 'findVersion'>,
  environment: NodeJS.ProcessEnv = process.env,
): DeploymentService {
  const provider = environment.DEPLOYMENT_PROVIDER?.trim().toLowerCase();
  if (provider === undefined || provider === '' || provider === 'local')
    return new LocalDeploymentProvider(environment.PREVIEW_BASE_URL);
  if (provider !== 'cloudflare-pages')
    throw new Error(`Unsupported DEPLOYMENT_PROVIDER: ${provider}`);
  const config = cloudflarePagesEnvironmentSchema.parse({
    CLOUDFLARE_API_TOKEN: environment.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: environment.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_PAGES_PROJECT_PREFIX:
      environment.CLOUDFLARE_PAGES_PROJECT_PREFIX,
  });
  return new CloudflarePagesDeploymentProvider(websites, config);
}
