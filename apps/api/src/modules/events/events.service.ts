import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

type CurrentUser = {
  id: string;
  role: UserRole;
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        location: data.location.trim(),
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt
          ? new Date(data.endsAt)
          : undefined,
        organizerId: userId,
      },
    });
  }

  findAll() {
    return this.prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  findMine(userId: string) {
    return this.prisma.event.findMany({
      where: {
        organizerId: userId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    currentUser: CurrentUser,
    data: UpdateEventDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const ownsEvent =
      event.organizerId === currentUser.id;

    const isAdmin =
      currentUser.role === UserRole.SUPER_ADMIN;

    if (!ownsEvent && !isAdmin) {
      throw new ForbiddenException(
        'You cannot modify this event',
      );
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(data.name !== undefined && {
          name: data.name.trim(),
        }),
        ...(data.description !== undefined && {
          description: data.description.trim(),
        }),
        ...(data.location !== undefined && {
          location: data.location.trim(),
        }),
        ...(data.startsAt !== undefined && {
          startsAt: new Date(data.startsAt),
        }),
        ...(data.endsAt !== undefined && {
          endsAt: new Date(data.endsAt),
        }),
        ...(data.status !== undefined && {
          status: data.status,
        }),
      },
    });
  }
}
