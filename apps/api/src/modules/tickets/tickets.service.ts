import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InviteStatus } from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';

const ticketInclude = {
  ticketType: {
    include: {
      event: true,
    },
  },
  invite: {
    select: {
      token: true,
      status: true,
      createdById: true,
    },
  },
} as const;

type InviteRow = {
  token: string;
  status: InviteStatus;
  createdById: string;
};

// O código secreto do convite só é visível para quem comprou, enquanto o
// convite estiver pendente. Depois de aceite, ninguém o volta a ver.
function withInvite<T extends { invite: InviteRow | null }>(
  ticket: T,
  userId: string,
) {
  const { invite, ...rest } = ticket;

  return {
    ...rest,
    invite: invite
      ? {
          status: invite.status,
          token:
            invite.status === InviteStatus.PENDING &&
            invite.createdById === userId
              ? invite.token
              : null,
        }
      : null,
  };
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findMine(customerId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        customerId,
      },
      include: ticketInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets.map((ticket) => withInvite(ticket, customerId));
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
        include: ticketInclude,
      });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found',
      );
    }

    return withInvite(ticket, customerId);
  }
}
