import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { CommercialController } from './commercial.controller.js';
import { CommercialService } from './commercial.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CommercialController],
  providers: [CommercialService],
})
export class CommercialModule {}
