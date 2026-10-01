import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  TicketStatus,
  UserRole,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';


@Injectable()
export class CheckInsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async validate(
  userId: string,
  userRole: UserRole,
  data: ValidateTicketDto,
) {
  const ticket =
    await this.prisma.ticket.findUnique({
      where: {
        code: data.code
          .trim()
          .toUpperCase(),
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

  const gate =
    await this.prisma.gate.findUnique({
      where: {
        id: data.gateId,
      },
    });

  if (!gate) {
    throw new NotFoundException(
      'Gate not found',
    );
  }

  if (
    gate.eventId !==
    ticket.ticketType.event.id
  ) {
    throw new BadRequestException(
      'This ticket does not belong to this gate event',
    );
  }

  if (
    userRole !== UserRole.SUPER_ADMIN
  ) {
    const assignment =
      await this.prisma.gateStaff.findUnique({
        where: {
          gateId_userId: {
            gateId: gate.id,
            userId,
          },
        },
      });

    if (!assignment) {
      throw new ForbiddenException(
        'You are not assigned to this gate',
      );
    }
  }

  if (
    ticket.status ===
    TicketStatus.USED
  ) {
    throw new BadRequestException(
      'Ticket already used',
    );
  }

  if (
    ticket.status ===
    TicketStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Ticket is cancelled',
    );
  }

  return this.prisma.$transaction(
    async (tx) => {
      const updatedTicket =
        await tx.ticket.update({
          where: {
            id: ticket.id,
          },
          data: {
            status:
              TicketStatus.USED,
          },
        });

      const checkIn =
        await tx.checkIn.create({
          data: {
            ticketId: ticket.id,
            validatedById: userId,
            gateId: gate.id,
          },
        });

      return {
        success: true,
        message: 'Entry authorized',
        gate: {
          id: gate.id,
          name: gate.name,
        },
        ticket: {
          ...updatedTicket,
          ticketType:
            ticket.ticketType,
        },
        checkIn,
      };
    },
  );
}
}
