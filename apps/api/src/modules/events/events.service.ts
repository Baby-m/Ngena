import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EventStatus,
  UserRole,
} from '../../../generated/prisma/client.js';

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

  // Listagem pública: apenas eventos publicados ou concluídos.
  findAll() {
    return this.prisma.event.findMany({
      where: {
        status: {
          in: [
            EventStatus.PUBLISHED,
            EventStatus.COMPLETED,
          ],
        },
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
        startsAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const event =
      await this.prisma.event.findFirst({
        where: {
          id,

          status: {
            in: [
              EventStatus.PUBLISHED,
              EventStatus.COMPLETED,
            ],
          },
        },

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
      throw new NotFoundException(
        'Event not found',
      );
    }

    return event;
  }

  async findOneForManagement(
    id: string,
    user: CurrentUser,
  ) {
    const event =
      await this.prisma.event.findUnique({
        where: {
          id,
        },

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
      throw new NotFoundException(
        'Event not found',
      );
    }

    const isOwner =
      event.organizerId === user.id;

    const isAdmin =
      user.role ===
      UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new NotFoundException(
        'Event not found',
      );
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

  /**
   * Recriar: cria um evento novo, em rascunho, a partir de um existente.
   * Copia nome, descrição, local, datas e tipos de bilhete.
   * Não copia portas, bilhetes vendidos, pagamentos nem check-ins.
   */
  async duplicate(id: string, user: CurrentUser) {
    // 404 se o evento não existir ou não for do utilizador (nem SUPER_ADMIN)
    const source = await this.findOneForManagement(id, user);

    const ticketTypes = await this.prisma.ticketType.findMany({
      where: { eventId: id },
      select: {
        name: true,
        description: true,
        price: true,
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

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.event.create({
        data: {
          name: `${source.name} (cópia)`,
          description: source.description,
          location: source.location,
          startsAt: source.startsAt,
          endsAt: source.endsAt,
          status: EventStatus.DRAFT,
          organizerId: user.id,
        },
      });

      if (ticketTypes.length > 0) {
        await tx.ticketType.createMany({
          data: ticketTypes.map((type) => ({
            eventId: copy.id,
            name: type.name,
            description: type.description,
            price: type.price,
            // capacidade original = o que resta + o que já foi vendido
            quantity: type.quantity + type._count.tickets,
          })),
        });
      }

      return tx.event.findUniqueOrThrow({
        where: { id: copy.id },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
          ticketTypes: true,
        },
      });
    });
  }

  /**
   * Eliminar: só eventos em rascunho e SEM atividade de vendas.
   *
   * O PDF fala em "abaixo de 5%", mas apagar um evento com bilhetes vendidos
   * implica decidir o que acontece aos bilhetes, aos pagamentos e ao dinheiro.
   * Até a equipa decidir, qualquer bilhete ou pagamento (mesmo falhado) bloqueia.
   */
  async remove(id: string, user: CurrentUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        organizerId: true,
        status: true,
      },
    });

    if (
      !event ||
      (event.organizerId !== user.id &&
        user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new ConflictException(
        'Only draft events can be deleted',
      );
    }

    const [tickets, payments] = await Promise.all([
      this.prisma.ticket.count({
        where: { ticketType: { eventId: id } },
      }),
      this.prisma.payment.count({
        where: { ticketType: { eventId: id } },
      }),
    ]);

    if (tickets > 0 || payments > 0) {
      throw new ConflictException(
        'Events with sales activity cannot be deleted',
      );
    }

    try {
      // Só apaga se continuar em rascunho (protege contra mudanças em simultâneo)
      const result = await this.prisma.event.deleteMany({
        where: {
          id,
          status: EventStatus.DRAFT,
        },
      });

      if (result.count !== 1) {
        throw new ConflictException(
          'Event can no longer be deleted',
        );
      }
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Event has related records and cannot be deleted',
        );
      }

      throw error;
    }

    return { message: 'Event deleted' };
  }
}
