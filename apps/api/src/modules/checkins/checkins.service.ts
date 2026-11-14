import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RealtimeGateway,
} from '../realtime/realtime.gateway.js';

import {
  TicketStatus,
  UserRole,
} from '../../../generated/prisma/client.js';

import {
  PrismaService,
} from '../../database/prisma.service.js';

import {
  ValidateTicketDto,
} from './dto/validate-ticket.dto.js';

@Injectable()
export class CheckInsService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly realtimeGateway:
      RealtimeGateway,
  ) {}

  findMine(userId: string) {
    return this.prisma.checkIn.findMany({
      where: {
        validatedById: userId,
      },

      include: {
        gate: {
          select: {
            id: true,
            name: true,

            event: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },

        ticket: {
          select: {
            id: true,
            code: true,
            status: true,

            ticketType: {
              select: {
                id: true,
                name: true,
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

  async validate(
    userId: string,
    userRole: UserRole,
    data: ValidateTicketDto,
  ) {
    const code =
      data.code
        .trim()
        .toUpperCase();

    const ticket =
      await this.prisma.ticket.findUnique({
        where: {
          code,
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
      userRole !==
      UserRole.SUPER_ADMIN
    ) {
      const assignment =
        await this.prisma.gateStaff.findUnique({
          where: {
            gateId_userId: {
              gateId:
                gate.id,
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

    const result =
      await this.prisma.$transaction(
        async (tx) => {
        /*
         * Este updateMany também funciona como
         * proteção adicional contra duas validações
         * concorrentes do mesmo ticket.
         */
        const update =
          await tx.ticket.updateMany({
            where: {
              id: ticket.id,
              status:
                TicketStatus.VALID,
            },

            data: {
              status:
                TicketStatus.USED,
            },
          });

        if (update.count !== 1) {
          throw new BadRequestException(
            'Ticket already used or unavailable',
          );
        }

        const checkIn =
          await tx.checkIn.create({
            data: {
              ticketId:
                ticket.id,

              validatedById:
                userId,

              gateId:
                gate.id,
            },
          });

        const updatedTicket =
          await tx.ticket.findUnique({
            where: {
              id: ticket.id,
            },
          });

                return {
          success: true,

          message:
            'Entry authorized',

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

    this.realtimeGateway
      .emitCheckInCreated({
        eventId:
          ticket
            .ticketType
            .event
            .id,

        gateId:
          gate.id,

        checkInId:
          result.checkIn.id,

        createdAt:
          result.checkIn
            .createdAt,
      });

    return result;
  }
}
