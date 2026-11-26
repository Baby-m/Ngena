import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module.js';

import { EntryRequestsController } from './entry-requests.controller.js';
import { GateEntryRequestsController } from './gate-entry-requests.controller.js';
import { EntryRequestDecisionsController } from './entry-request-decisions.controller.js';
import { EntryRequestsService } from './entry-requests.service.js';

@Module({
  imports: [
    RealtimeModule,
  ],
  controllers: [
    EntryRequestsController,
    GateEntryRequestsController,
    EntryRequestDecisionsController,
  ],
  providers: [
    EntryRequestsService,
  ],
})
export class EntryRequestsModule {}
