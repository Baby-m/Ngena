import { randomBytes } from 'node:crypto';

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
    // 1 ou 2 bilhetes por compra (validado no DTO).
    const quantity = dto.quantity ?? 1;

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

    if (ticketType.quantity < quantity) {
      throw new BadRequestException('Not enough tickets available');
    }

    // Valor total da compra: preço unitário x número de bilhetes.
    const total = ticketType.price.mul(quantity);

    // Provider simulado: não realiza uma cobrança financeira real.
    const charge = await this.provider.charge({
      amount: total.toString(),
      method: dto.method,
      phone: dto.phone,
      simulate: dto.simulate,
    });

    const base = {
      amount: total,
      quantity,
      method: dto.method,
      phone: dto.phone,
      reference: charge.reference,
      customerId,
      ticketTypeId: ticketType.id,
    };

    // Se o pagamento falhar, guardamos o registo sem criar encomenda
    // ou bilhetes e sem reduzir a quantidade disponível.
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
        tickets: [],
        invites: [],
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

      // A atualização condicional impede a venda dos mesmos últimos
      // bilhetes a vários clientes em simultâneo. Desconta todos de uma vez.
      const reserved = await tx.ticketType.updateMany({
        where: {
          id: ticketType.id,
          quantity: {
            gte: quantity,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      if (reserved.count === 0) {
        await tx.payment.create({
          data: {
            ...base,
            status: PaymentStatus.FAILED,
            failureReason:
              quantity > 1 ? 'Not enough tickets available' : 'Sold out',
          },
        });

        return null;
      }

      const order = await tx.order.create({
        data: {
          customerId,
          total,
          status: OrderStatus.CONFIRMED,
        },
      });

      const tickets = [];

      for (let index = 0; index < quantity; index += 1) {
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

        tickets.push(ticket);
      }

      // Todos os bilhetes ficam na conta de quem comprou. Do segundo em diante,
      // cada bilhete tem um convite: quem o aceitar fica com o bilhete na sua conta.
      const invites = [];

      for (const ticket of tickets.slice(1)) {
        const invite = await tx.ticketInvite.create({
          data: {
            token: this.generateInviteToken(),
            ticketId: ticket.id,
            createdById: customerId,
          },
          select: {
            token: true,
            ticketId: true,
          },
        });

        invites.push(invite);
      }

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
        ticket: tickets[0],
        tickets,
        invites,
      };
    });

    if (!result) {
      throw new BadRequestException(
        quantity > 1
          ? 'Not enough tickets available'
          : 'This ticket type is sold out',
      );
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

  // Código secreto do convite: 24 bytes aleatórios (192 bits), difícil de adivinhar.
  private generateInviteToken() {
    return randomBytes(24).toString('base64url');
  }
}
