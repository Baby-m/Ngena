import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UserRole,
} from '../../../generated/prisma/client.js';

import {
  PrismaService,
} from '../../database/prisma.service.js';

type CurrentUser = {
  id: string;
  role: UserRole;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getOrganizerOverview(
    user: CurrentUser,
  ) {
    const eventWhere =
      user.role === UserRole.SUPER_ADMIN
        ? {}
        : {
            organizerId: user.id,
          };

    const events =
      await this.prisma.event.findMany({
        where: eventWhere,

        select: {
          id: true,
          name: true,
          status: true,
          startsAt: true,
          location: true,

          ticketTypes: {
            select: {
              id: true,
              price: true,

              tickets: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },

          gates: {
            select: {
              id: true,
              name: true,

              checkIns: {
                select: {
                  id: true,
                  createdAt: true,
                },
              },
            },
          },
        },

        orderBy: {
          startsAt: 'desc',
        },
      });

    const now = new Date();

    const startOfToday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

    let totalTickets = 0;
    let usedTickets = 0;
    let totalRevenue = 0;
    let checkInsToday = 0;

    const eventStats =
      events.map((event) => {
        let eventTickets = 0;
        let eventUsedTickets = 0;
        let eventRevenue = 0;
        let eventCheckIns = 0;

        for (
          const ticketType
          of event.ticketTypes
        ) {
          const issued =
            ticketType.tickets.length;

          const used =
            ticketType.tickets.filter(
              (ticket) =>
                ticket.status ===
                'USED',
            ).length;

          eventTickets += issued;
          eventUsedTickets += used;

          eventRevenue +=
            Number(ticketType.price) *
            issued;
        }

        for (
          const gate
          of event.gates
        ) {
          eventCheckIns +=
            gate.checkIns.length;

          checkInsToday +=
            gate.checkIns.filter(
              (checkIn) =>
                checkIn.createdAt >=
                startOfToday,
            ).length;
        }

        totalTickets +=
          eventTickets;

        usedTickets +=
          eventUsedTickets;

        totalRevenue +=
          eventRevenue;

        return {
          id: event.id,
          name: event.name,
          status: event.status,
          startsAt: event.startsAt,
          location: event.location,
          tickets: eventTickets,
          usedTickets: eventUsedTickets,
          checkIns: eventCheckIns,
          revenue:
            Number(
              eventRevenue.toFixed(2),
            ),
        };
      });

    return {
      summary: {
        totalEvents:
          events.length,

        totalTickets,

        usedTickets,

        unusedTickets:
          totalTickets -
          usedTickets,

        checkInsToday,

        totalRevenue:
          Number(
            totalRevenue.toFixed(2),
          ),
      },

      events:
        eventStats,
    };
  }

  async getEventStats(
    eventId: string,
    user: CurrentUser,
  ) {
    const event =
      await this.prisma.event.findUnique({
        where: {
          id: eventId,
        },

        include: {
          ticketTypes: {
            include: {
              tickets: true,
            },
          },

          gates: {
            include: {
              checkIns: true,

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
          },
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Event not found',
      );
    }

    if (
      user.role !==
        UserRole.SUPER_ADMIN &&
      event.organizerId !==
        user.id
    ) {
      throw new NotFoundException(
        'Event not found',
      );
    }

    const ticketTypes =
      event.ticketTypes.map(
        (ticketType) => {
          const issued =
            ticketType.tickets.length;

          const used =
            ticketType.tickets.filter(
              (ticket) =>
                ticket.status ===
                'USED',
            ).length;

          return {
            id: ticketType.id,
            name: ticketType.name,

            price:
              Number(
                ticketType.price,
              ),

            issued,

            used,

            available:
              ticketType.quantity,

            revenue:
              Number(
                (
                  Number(
                    ticketType.price,
                  ) * issued
                ).toFixed(2),
              ),
          };
        },
      );

    const gates =
      event.gates.map(
        (gate) => ({
          id: gate.id,
          name: gate.name,

          checkIns:
            gate.checkIns.length,

          staff:
            gate.staff.map(
              (assignment) =>
                assignment.user,
            ),
        }),
      );

    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        location:
          event.location,
        startsAt:
          event.startsAt,
        endsAt:
          event.endsAt,
      },

      ticketTypes,
      gates,
    };
  }

  async getAdminEvents() {
    const events =
      await this.prisma.event.findMany({
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          ticketTypes: {
            include: {
              tickets: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },

          gates: {
            include: {
              checkIns: {
                select: {
                  id: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return events.map(
      (event) => {
        const totalTickets =
          event.ticketTypes.reduce(
            (total, type) =>
              total +
              type.tickets.length,
            0,
          );

        const usedTickets =
          event.ticketTypes.reduce(
            (total, type) =>
              total +
              type.tickets.filter(
                (ticket) =>
                  ticket.status ===
                  'USED',
              ).length,
            0,
          );

        const totalRevenue =
          event.ticketTypes.reduce(
            (total, type) =>
              total +
              Number(type.price) *
                type.tickets.length,
            0,
          );

        const totalCheckIns =
          event.gates.reduce(
            (total, gate) =>
              total +
              gate.checkIns.length,
            0,
          );

        return {
          id: event.id,
          name: event.name,
          description:
            event.description,
          status: event.status,
          location:
            event.location,
          startsAt:
            event.startsAt,
          endsAt:
            event.endsAt,
          createdAt:
            event.createdAt,

          organizer:
            event.organizer,

          stats: {
            ticketTypes:
              event.ticketTypes.length,

            gates:
              event.gates.length,

            totalTickets,

            usedTickets,

            totalCheckIns,

            estimatedRevenue:
              Number(
                totalRevenue.toFixed(2),
              ),
          },
        };
      },
    );
  }
}
