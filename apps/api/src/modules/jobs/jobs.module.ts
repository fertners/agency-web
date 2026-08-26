import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { QueueModule } from '../../infrastructure/queue/queue.module.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
