import {
  DEPLOYMENT_QUEUE_NAME,
  DESIGN_REVIEW_QUEUE_NAME,
  FOUNDATION_QUEUE_NAME,
  GENERATION_QUEUE_NAME,
  PROSPECT_QUEUE_NAME,
  QUALITY_QUEUE_NAME,
  ORCHESTRATION_QUEUE_NAME,
  createRedisConnection,
  getRedisUrl,
} from '@ai-web-agency/queue';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Queue } from 'bullmq';

const SUPPORTED_QUEUES = new Set([
  DEPLOYMENT_QUEUE_NAME,
  DESIGN_REVIEW_QUEUE_NAME,
  FOUNDATION_QUEUE_NAME,
  GENERATION_QUEUE_NAME,
  PROSPECT_QUEUE_NAME,
  QUALITY_QUEUE_NAME,
  ORCHESTRATION_QUEUE_NAME,
]);

@Injectable()
export class AgentJobQueueControlService implements OnApplicationShutdown {
  private readonly queues = new Map<string, Queue>();

  async retry(queueName: string, queueJobId: string): Promise<void> {
    const job = await this.getQueue(queueName).getJob(queueJobId);
    if (job === undefined) throw new Error('Queue job not found');
    if ((await job.getState()) !== 'failed')
      throw new Error('Only failed queue jobs can be retried');
    await job.retry('failed');
  }

  async cancel(queueName: string, queueJobId: string): Promise<void> {
    const job = await this.getQueue(queueName).getJob(queueJobId);
    if (job === undefined) throw new Error('Queue job not found');
    const state = await job.getState();
    if (
      !['waiting', 'delayed', 'prioritized', 'waiting-children'].includes(state)
    )
      throw new Error(`Queue job cannot be cancelled while ${state}`);
    await job.remove();
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
  }

  private getQueue(name: string): Queue {
    if (!SUPPORTED_QUEUES.has(name)) throw new Error('Unsupported queue');
    const existing = this.queues.get(name);
    if (existing !== undefined) return existing;
    const queue = new Queue(name, {
      connection: createRedisConnection(getRedisUrl()),
    });
    this.queues.set(name, queue);
    return queue;
  }
}
