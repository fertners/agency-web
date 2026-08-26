import {
  AgentJobRepository,
  AICallRepository,
  DesignReviewRepository,
  QualityReportRepository,
  ProspectRepository,
  CommercialRepository,
  DeliveryRepository,
  createDatabaseClient,
  WebsiteRepository,
} from '@ai-web-agency/database';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

import type { HealthProbe } from '../health-probe.js';

@Injectable()
export class DatabaseService implements HealthProbe, OnApplicationShutdown {
  private readonly client = createDatabaseClient();
  readonly agentJobs = new AgentJobRepository(this.client.db);
  readonly aiCalls = new AICallRepository(this.client.db);
  readonly designReviews = new DesignReviewRepository(this.client.db);
  readonly qualityReports = new QualityReportRepository(this.client.db);
  readonly prospects = new ProspectRepository(this.client.db);
  readonly commercial = new CommercialRepository(this.client.db);
  readonly delivery = new DeliveryRepository(this.client.db);
  readonly websites = new WebsiteRepository(this.client.db);

  async ping(): Promise<void> {
    await this.client.pool.query('select 1');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
