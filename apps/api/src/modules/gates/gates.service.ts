import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AssignStaffDto } from './dto/assign-staff.dto.js';
import { CreateGateDto } from './dto/create-gate.dto.js';

type CurrentUser = {
  id: string;
  role: UserRole;
};

@Injectable()
export class GatesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async ensureCanManageEvent(
    eventId: string,
    user: CurrentUser,
  ) {
    const event =
      await this.prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          organizerId: true,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Event not found',
      );
    }

    const isOwner =
      event.organizerId === user.id;

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You cannot manage gates for this event',
      );
    }

    return event;
  }

  async create(
    eventId: string,
    user: CurrentUser,
    data: CreateGateDto,
  ) {
    await this.ensureCanManageEvent(
      eventId,
      user,
    );

    return this.prisma.gate.create({
      data: {
        name: data.name.trim(),
        eventId,
      },
    });
  }

  findByEvent(eventId: string) {
    return this.prisma.gate.findMany({
      where: {
        eventId,
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async assignStaff(
    gateId: string,
    currentUser: CurrentUser,
    data: AssignStaffDto,
  ) {
    const gate =
      await this.prisma.gate.findUnique({
        where: { id: gateId },
        include: {
          event: {
            select: {
              id: true,
              organizerId: true,
            },
          },
        },
      });

    if (!gate) {
      throw new NotFoundException(
        'Gate not found',
      );
    }

    const isOwner =
      gate.event.organizerId ===
      currentUser.id;

    const isAdmin =
      currentUser.role ===
      UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You cannot manage this gate',
      );
    }

    const staffUser =
      await this.prisma.user.findUnique({
        where: {
          id: data.userId,
        },
      });

    if (!staffUser) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (
      staffUser.role !==
        UserRole.GATE_STAFF &&
      staffUser.role !==
        UserRole.GATE_MANAGER
    ) {
      throw new BadRequestException(
        'User must be GATE_STAFF or GATE_MANAGER',
      );
    }

    return this.prisma.gateStaff.upsert({
      where: {
        gateId_userId: {
          gateId,
          userId: data.userId,
        },
      },
      create: {
        gateId,
        userId: data.userId,
      },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async removeStaff(
    gateId: string,
    userId: string,
    currentUser: CurrentUser,
  ) {
    const gate =
      await this.prisma.gate.findUnique({
        where: { id: gateId },
        include: {
          event: {
            select: {
              organizerId: true,
            },
          },
        },
      });

    if (!gate) {
      throw new NotFoundException(
        'Gate not found',
      );
    }

    const isOwner =
      gate.event.organizerId ===
      currentUser.id;

    const isAdmin =
      currentUser.role ===
      UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You cannot manage this gate',
      );
    }

    const assignment =
      await this.prisma.gateStaff.findUnique({
        where: {
          gateId_userId: {
            gateId,
            userId,
          },
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Staff assignment not found',
      );
    }

    await this.prisma.gateStaff.delete({
      where: {
        gateId_userId: {
          gateId,
          userId,
        },
      },
    });

    return {
      message: 'Staff removed from gate',
    };
  }

  findMine(userId: string) {
    return this.prisma.gateStaff.findMany({
      where: {
        userId,
      },
      include: {
        gate: {
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
}
