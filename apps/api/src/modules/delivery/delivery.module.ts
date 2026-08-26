import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { QueueModule } from '../../infrastructure/queue/queue.module.js';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryService } from './delivery.service.js';
@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
