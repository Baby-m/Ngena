import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TicketStatus } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';

@Injectable()
export class CheckInsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async validate(
    userId: string,
    data: ValidateTicketDto,
  ) {
    const ticket =
      await this.prisma.ticket.findUnique({
        where: {
          code: data.code.trim().toUpperCase(),
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

    if (ticket.status === TicketStatus.USED) {
      throw new BadRequestException(
        'Ticket already used',
      );
    }

    if (
      ticket.status === TicketStatus.CANCELLED
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
              status: TicketStatus.USED,
            },
          });

        const checkIn =
          await tx.checkIn.create({
            data: {
              ticketId: ticket.id,
              validatedById: userId,
            },
          });

        return {
          success: true,
          message: 'Entry authorized',
          ticket: {
            ...updatedTicket,
            ticketType: ticket.ticketType,
          },
          checkIn,
        };
      },
    );
  }
}
