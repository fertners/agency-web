export interface DeploymentService {
  deploy(input: {
    websiteId: string;
    versionId: string;
  }): Promise<{ url: string }>;
}

export class LocalDeploymentProvider implements DeploymentService {
  constructor(private readonly previewBaseUrl = 'http://127.0.0.1:3002') {}
  deploy(input: { websiteId: string; versionId: string }) {
    return Promise.resolve({
      url: `${this.previewBaseUrl}/preview/${input.websiteId}/${input.versionId}`,
    });
  }
}
