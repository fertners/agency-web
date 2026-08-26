import { Module } from '@nestjs/common';

import { HealthModule } from './modules/health/health.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { WebsitesModule } from './modules/websites/websites.module.js';
import { ProspectsModule } from './modules/prospects/prospects.module.js';
import { CommercialModule } from './modules/commercial/commercial.module.js';
import { DeliveryModule } from './modules/delivery/delivery.module.js';
import { OperationsModule } from './modules/operations/operations.module.js';

@Module({
  imports: [
    HealthModule,
    JobsModule,
    WebsitesModule,
    ProspectsModule,
    CommercialModule,
    DeliveryModule,
    OperationsModule,
  ],
})
export class AppModule {}
