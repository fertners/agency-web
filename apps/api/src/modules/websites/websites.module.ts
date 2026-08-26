import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { QueueModule } from '../../infrastructure/queue/queue.module.js';
import { WebsitesController } from './websites.controller.js';
import { WebsitesService } from './websites.service.js';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [WebsitesController],
  providers: [WebsitesService],
})
export class WebsitesModule {}
