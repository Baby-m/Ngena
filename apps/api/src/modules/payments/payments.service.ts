import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  OrderStatus,
  PaymentStatus,
  TicketStatus,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface.js';
import type { PaymentProvider } from './providers/payment-provider.interface.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProvider,
  ) {}

  async pay(customerId: string, dto: CreatePaymentDto) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: dto.ticketTypeId },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    // Resposta rapida: se ja esgotou, nem chega a cobrar
    if (ticketType.quantity <= 0) {
      throw new BadRequestException('This ticket type is sold out');
    }

    // 1) "Cobrar" (aqui e o banco de mentira)
    const charge = await this.provider.charge({
      amount: ticketType.price.toString(),
      method: dto.method,
      phone: dto.phone,
      simulate: dto.simulate,
    });

    const base = {
      amount: ticketType.price,
      method: dto.method,
      phone: dto.phone,
      reference: charge.reference,
      customerId,
      ticketTypeId: ticketType.id,
    };

    // 2) Falhou: so guardamos o registo. Nada mais muda.
    if (!charge.success) {
      const payment = await this.prisma.payment.create({
        data: {
          ...base,
          status: PaymentStatus.FAILED,
          failureReason: charge.failureReason,
        },
      });

      return { payment, order: null, ticket: null };
    }

    // 3) Pagou: stock + encomenda + bilhete + pagamento, tudo ou nada
    const result = await this.prisma.$transaction(async (tx) => {
      const reserved = await tx.ticketType.updateMany({
        where: { id: ticketType.id, quantity: { gte: 1 } },
        data: { quantity: { decrement: 1 } },
      });

      // Esgotou no mesmo instante (outra pessoa comprou o ultimo)
      if (reserved.count === 0) {
        await tx.payment.create({
          data: {
            ...base,
            status: PaymentStatus.FAILED,
            failureReason: 'Sold out',
          },
        });

        return null;
      }

      const order = await tx.order.create({
        data: {
          customerId,
          total: ticketType.price,
          status: OrderStatus.CONFIRMED,
        },
      });

      const ticket = await tx.ticket.create({
        data: {
          code: this.generateTicketCode(),
          status: TicketStatus.VALID,
          orderId: order.id,
          customerId,
          ticketTypeId: ticketType.id,
        },
        include: { ticketType: { include: { event: true } } },
      });

      const payment = await tx.payment.create({
        data: {
          ...base,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          orderId: order.id,
        },
      });

      return { payment, order, ticket };
    });

    if (!result) {
      throw new BadRequestException('This ticket type is sold out');
    }

    return result;
  }

  findMine(customerId: string) {
    return this.prisma.payment.findMany({
      where: { customerId },
      include: { ticketType: { include: { event: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateTicketCode() {
    return `NGENA-${crypto
      .randomUUID()
      .replaceAll('-', '')
      .slice(0, 8)
      .toUpperCase()}`;
  }
}
