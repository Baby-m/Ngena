import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findMine(customerId: string) {
    return this.prisma.ticket.findMany({
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

  async findOneForUser(
    id: string,
    customerId: string,
  ) {
    const ticket =
      await this.prisma.ticket.findFirst({
        where: {
          id,
          customerId,
        },
        include: {
          ticketType: {
            include: {
              event: true,
            },
          },
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found',
      );
    }

    return ticket;
  }
}
