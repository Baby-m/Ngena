import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EventStatus,
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
      include: {
        event: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    // Só é permitido comprar bilhetes para eventos publicados.
    if (ticketType.event.status !== EventStatus.PUBLISHED) {
      throw new ForbiddenException(
        'Tickets can only be purchased for published events',
      );
    }

    // Se já esgotou, não tentamos processar o pagamento.
    if (ticketType.quantity <= 0) {
      throw new BadRequestException('This ticket type is sold out');
    }

    // Provider simulado: não realiza uma cobrança financeira real.
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

    // Se o pagamento falhar, guardamos o registo sem criar encomenda
    // ou bilhete e sem reduzir a quantidade disponível.
    if (!charge.success) {
      const payment = await this.prisma.payment.create({
        data: {
          ...base,
          status: PaymentStatus.FAILED,
          failureReason: charge.failureReason,
        },
      });

      return {
        payment,
        order: null,
        ticket: null,
      };
    }

    // Verificamos novamente o estado do evento e reservamos o stock
    // dentro da transação.
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: {
          id: ticketType.eventId,
        },
        select: {
          status: true,
        },
      });

      if (!event || event.status !== EventStatus.PUBLISHED) {
        throw new ForbiddenException(
          'Tickets can only be purchased for published events',
        );
      }

      // A atualização condicional impede a venda do mesmo último
      // bilhete a vários clientes em simultâneo.
      const reserved = await tx.ticketType.updateMany({
        where: {
          id: ticketType.id,
          quantity: {
            gte: 1,
          },
        },
        data: {
          quantity: {
            decrement: 1,
          },
        },
      });

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
        include: {
          ticketType: {
            include: {
              event: true,
            },
          },
        },
      });

      const payment = await tx.payment.create({
        data: {
          ...base,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          orderId: order.id,
        },
      });

      return {
        payment,
        order,
        ticket,
      };
    });

    if (!result) {
      throw new BadRequestException('This ticket type is sold out');
    }

    return result;
  }

  findMine(customerId: string) {
    return this.prisma.payment.findMany({
      where: {
        customerId,
      },
      include: {
        ticketType: {
          include: {
            event: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
