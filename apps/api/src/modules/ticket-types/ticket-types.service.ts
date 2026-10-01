import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto.js';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto.js';

type CurrentUser = {
  id: string;
  role: UserRole;
};

@Injectable()
export class TicketTypesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async ensureCanManageEvent(
    eventId: string,
    user: CurrentUser,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isOwner =
      event.organizerId === user.id;

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You cannot manage ticket types for this event',
      );
    }

    return event;
  }

  async create(
    eventId: string,
    user: CurrentUser,
    data: CreateTicketTypeDto,
  ) {
    await this.ensureCanManageEvent(
      eventId,
      user,
    );

    return this.prisma.ticketType.create({
      data: {
        name: data.name.trim(),
        description:
          data.description?.trim(),
        price: data.price,
        quantity: data.quantity,
        eventId,
      },
    });
  }

  findByEvent(eventId: string) {
    return this.prisma.ticketType.findMany({
      where: {
        eventId,
      },
      orderBy: {
        price: 'asc',
      },
    });
  }

  async update(
    id: string,
    user: CurrentUser,
    data: UpdateTicketTypeDto,
  ) {
    const ticketType =
      await this.prisma.ticketType.findUnique({
        where: { id },
        select: {
          id: true,
          eventId: true,
        },
      });

    if (!ticketType) {
      throw new NotFoundException(
        'Ticket type not found',
      );
    }

    await this.ensureCanManageEvent(
      ticketType.eventId,
      user,
    );

    return this.prisma.ticketType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && {
          name: data.name.trim(),
        }),
        ...(data.description !== undefined && {
          description:
            data.description.trim(),
        }),
        ...(data.price !== undefined && {
          price: data.price,
        }),
        ...(data.quantity !== undefined && {
          quantity: data.quantity,
        }),
      },
    });
  }

  async remove(
    id: string,
    user: CurrentUser,
  ) {
    const ticketType =
      await this.prisma.ticketType.findUnique({
        where: { id },
        select: {
          id: true,
          eventId: true,
        },
      });

    if (!ticketType) {
      throw new NotFoundException(
        'Ticket type not found',
      );
    }

    await this.ensureCanManageEvent(
      ticketType.eventId,
      user,
    );

    await this.prisma.ticketType.delete({
      where: { id },
    });

    return {
      message: 'Ticket type deleted',
    };
  }
}
