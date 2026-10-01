import { Module } from '@nestjs/common';

import { CheckInsController } from './checkins.controller.js';
import { CheckInsService } from './checkins.service.js';

@Module({
  controllers: [CheckInsController],
  providers: [CheckInsService],
})
export class CheckInsModule {}
