import { Module } from '@nestjs/common';

import { DATABASE_HEALTH_PROBE } from '../health-probe.js';
import { DatabaseService } from './database.service.js';

@Module({
  providers: [
    DatabaseService,
    {
      provide: DATABASE_HEALTH_PROBE,
      useExisting: DatabaseService,
    },
  ],
  exports: [DatabaseService, DATABASE_HEALTH_PROBE],
})
export class DatabaseModule {}
