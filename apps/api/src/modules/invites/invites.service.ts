import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InviteStatus,
  TicketStatus,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';

type AuthUser = {
  id: string;
};

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  // Público: mostra o evento e o estado do convite, sem dados pessoais
  // e sem o código do bilhete.
  async preview(token: string) {
    const invite = await this.prisma.ticketInvite.findUnique({
      where: { token },
      select: {
        status: true,
        ticket: {
          select: {
            status: true,
            ticketType: {
              select: {
                name: true,
                event: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                    startsAt: true,
                    endsAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return {
      status: invite.status,
      // Só pode ser aceite enquanto estiver pendente e o bilhete ainda for válido.
      claimable:
        invite.status === InviteStatus.PENDING &&
        invite.ticket.status === TicketStatus.VALID,
      ticketType: {
        name: invite.ticket.ticketType.name,
      },
      event: invite.ticket.ticketType.event,
    };
  }

  // Aceitar o convite: o bilhete passa para a conta de quem aceita, uma só vez.
  async claim(token: string, user: AuthUser) {
    const invite = await this.prisma.ticketInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.createdById === user.id) {
      throw new BadRequestException('You cannot claim your own invite');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new ConflictException('Invite already claimed');
    }

    return this.prisma.$transaction(async (tx) => {
      // Só um pedido consegue passar o convite de PENDING para CLAIMED.
      const claimed = await tx.ticketInvite.updateMany({
        where: {
          id: invite.id,
          status: InviteStatus.PENDING,
        },
        data: {
          status: InviteStatus.CLAIMED,
          claimedById: user.id,
          claimedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new ConflictException('Invite already claimed');
      }

      // Só passa o bilhete se ainda for válido (não usado nem cancelado).
      // Se falhar, a transação desfaz também o passo anterior.
      const moved = await tx.ticket.updateMany({
        where: {
          id: invite.ticketId,
          status: TicketStatus.VALID,
        },
        data: {
          customerId: user.id,
        },
      });

      if (moved.count !== 1) {
        throw new ConflictException('Ticket is no longer available');
      }

      return tx.ticket.findUniqueOrThrow({
        where: { id: invite.ticketId },
        include: {
          ticketType: {
            include: {
              event: true,
            },
          },
        },
      });
    });
  }
}
