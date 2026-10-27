import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface.js';
import { SimulatedProvider } from './providers/simulated.provider.js';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      useClass: SimulatedProvider,
    },
  ],
})
export class PaymentsModule {}
