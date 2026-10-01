import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  OrderStatus,
  TicketStatus,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    customerId: string,
    data: CreateOrderDto,
  ) {
    const ticketType =
      await this.prisma.ticketType.findUnique({
        where: {
          id: data.ticketTypeId,
        },
        include: {
          event: true,
        },
      });

    if (!ticketType) {
      throw new NotFoundException(
        'Ticket type not found',
      );
    }

    if (ticketType.quantity <= 0) {
      throw new BadRequestException(
        'This ticket type is sold out',
      );
    }

    const ticketCode =
      this.generateTicketCode();

    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.create({
            data: {
              customerId,
              total: ticketType.price,
              status:
                OrderStatus.CONFIRMED,
            },
          });

        const ticket =
          await tx.ticket.create({
            data: {
              code: ticketCode,
              status:
                TicketStatus.VALID,

              orderId: order.id,
              customerId,
              ticketTypeId:
                ticketType.id,
            },
            include: {
              ticketType: {
                include: {
                  event: true,
                },
              },
            },
          });

        await tx.ticketType.update({
          where: {
            id: ticketType.id,
          },
          data: {
            quantity: {
              decrement: 1,
            },
          },
        });

        return {
          order,
          ticket,
        };
      },
    );
  }

  async findMine(customerId: string) {
    return this.prisma.order.findMany({
      where: {
        customerId,
      },
      include: {
        tickets: {
          include: {
            ticketType: {
              include: {
                event: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private generateTicketCode() {
    return `NGENA-${crypto.randomUUID()
      .replaceAll('-', '')
      .slice(0, 8)
      .toUpperCase()}`;
  }
}
