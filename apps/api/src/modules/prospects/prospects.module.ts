import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { QueueModule } from '../../infrastructure/queue/queue.module.js';
import { ProspectsController } from './prospects.controller.js';
import { ProspectsService } from './prospects.service.js';
@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [ProspectsController],
  providers: [ProspectsService],
})
export class ProspectsModule {}
