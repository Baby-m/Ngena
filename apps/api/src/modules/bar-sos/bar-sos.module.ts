import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { BarSosController } from './bar-sos.controller.js';
import { BarSosService } from './bar-sos.service.js';

@Module({
  imports: [RealtimeModule],
  controllers: [BarSosController],
  providers: [BarSosService],
})
export class BarSosModule {}
