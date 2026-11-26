import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import type {
  ChargeInput,
  ChargeResult,
  PaymentProvider,
} from './payment-provider.interface.js';

@Injectable()
export class SimulatedProvider implements PaymentProvider {
  async charge(input: ChargeInput): Promise<ChargeResult> {
    // Trava de seguranca: sem PAYMENTS_MODE=simulated nao ha pagamentos
    if (process.env.PAYMENTS_MODE !== 'simulated') {
      throw new ServiceUnavailableException('Payments are not available');
    }

    const reference = `SIM-${crypto
      .randomUUID()
      .replaceAll('-', '')
      .slice(0, 12)
      .toUpperCase()}`;

    if (input.simulate === 'failure') {
      return { success: false, reference, failureReason: 'Simulated failure' };
    }

    return { success: true, reference };
  }
}
