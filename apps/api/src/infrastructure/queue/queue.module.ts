import { Module } from '@nestjs/common';

import { FoundationQueueService } from './foundation-queue.service.js';
import { GenerationQueueService } from './generation-queue.service.js';
import { DesignReviewQueueService } from './design-review-queue.service.js';
import { QualityQueueService } from './quality-queue.service.js';
import { ProspectQueueService } from './prospect-queue.service.js';
import { DeploymentQueueService } from './deployment-queue.service.js';
import { AgentJobQueueControlService } from './agent-job-queue-control.service.js';
import { OrchestrationQueueService } from './orchestration-queue.service.js';

@Module({
  providers: [
    FoundationQueueService,
    GenerationQueueService,
    DesignReviewQueueService,
    QualityQueueService,
    ProspectQueueService,
    DeploymentQueueService,
    AgentJobQueueControlService,
    OrchestrationQueueService,
  ],
  exports: [
    FoundationQueueService,
    GenerationQueueService,
    DesignReviewQueueService,
    QualityQueueService,
    ProspectQueueService,
    DeploymentQueueService,
    AgentJobQueueControlService,
    OrchestrationQueueService,
  ],
})
export class QueueModule {}
