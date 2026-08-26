import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { QueueModule } from '../../infrastructure/queue/queue.module.js';
import { OperationsController } from './operations.controller.js';
import { OperationsService } from './operations.service.js';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
