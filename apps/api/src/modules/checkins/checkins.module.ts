import {
  Module,
} from '@nestjs/common';

import {
  RealtimeModule,
} from '../realtime/realtime.module.js';

import {
  CheckInsController,
} from './checkins.controller.js';

import {
  CheckInsService,
} from './checkins.service.js';

@Module({
  imports: [
    RealtimeModule,
  ],

  controllers: [
    CheckInsController,
  ],

  providers: [
    CheckInsService,
  ],
})
export class CheckInsModule {}
