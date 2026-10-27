import { Injectable, NotFoundException } from '@nestjs/common';

import { EventStatus } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Eventos inexistentes ou não publicados não disponibilizam
    // informação pública sobre a disponibilidade dos bilhetes.
    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }

    const types = await this.prisma.ticketType.findMany({
      where: {
        eventId,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const ticketTypes = types.map((type) => {
      const remaining = Math.max(type.quantity, 0);
      const sold = type._count.tickets;
      const capacity = sold + remaining;
      const soldOut = remaining === 0;

      const percentSold = soldOut
        ? 100
        : Math.min(99, Math.floor((sold * 100) / capacity));

      return {
        id: type.id,
        name: type.name,
        percentSold,
        soldOut,
      };
    });

    return {
      eventId,
      soldOutAll:
        ticketTypes.length > 0 &&
        ticketTypes.every((type) => type.soldOut),
      ticketTypes,
    };
  }
}
