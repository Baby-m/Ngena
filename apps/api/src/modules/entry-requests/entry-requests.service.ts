import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EntryRequestStatus,
  TicketStatus,
  UserRole,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';

import { RealtimeGateway } from '../realtime/realtime.gateway.js';

@Injectable()
export class EntryRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private async findAuthorizedRequest(
    requestId: string,
    userId: string,
    userRole: UserRole,
  ) {
    if (
      userRole !== UserRole.GATE_STAFF &&
      userRole !== UserRole.GATE_MANAGER &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You cannot resolve entry requests',
      );
    }

    const request = await this.prisma.entryRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        ticketId: true,
        gateId: true,
        customerId: true,
        gate: {
          select: {
            eventId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Entry request not found',
      );
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      const assignment = await this.prisma.gateStaff.findUnique({
        where: {
          gateId_userId: {
            gateId: request.gateId,
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

    return request;
  }

  async confirm(
    requestId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const request = await this.findAuthorizedRequest(
      requestId,
      userId,
      userRole,
    );

    const resolvedAt = new Date();

    const result = await this.prisma.$transaction(
      async (tx) => {
        // Lock the ticket before updating the entry request.
        // This follows the same lock order as QR validation.
        const lockedTickets = await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "id"
          FROM "Ticket"
          WHERE "id" = ${request.ticketId}
          FOR UPDATE
        `;

        if (lockedTickets.length !== 1) {
          throw new NotFoundException(
            'Ticket not found',
          );
        }

        // Recheck the ticket status while holding the lock.
        const currentTicket = await tx.ticket.findUnique({
          where: {
            id: request.ticketId,
          },
          select: {
            status: true,
          },
        });

        if (
          currentTicket?.status !== TicketStatus.VALID
        ) {
          throw new BadRequestException(
            'Ticket already used or unavailable',
          );
        }

        const updatedRequest =
          await tx.entryRequest.updateMany({
            where: {
              id: request.id,
              status: EntryRequestStatus.PENDING,
            },
            data: {
              status: EntryRequestStatus.CONFIRMED,
              resolvedById: userId,
              resolvedAt,
            },
          });

        if (updatedRequest.count !== 1) {
          throw new ConflictException(
            'Entry request has already been resolved',
          );
        }

        const updatedTicket =
          await tx.ticket.updateMany({
            where: {
              id: request.ticketId,
              status: TicketStatus.VALID,
            },
            data: {
              status: TicketStatus.USED,
            },
          });

        if (updatedTicket.count !== 1) {
          throw new BadRequestException(
            'Ticket already used or unavailable',
          );
        }

        const checkIn = await tx.checkIn.create({
          data: {
            ticketId: request.ticketId,
            validatedById: userId,
            gateId: request.gateId,
          },
        });

        return {
          success: true,
          message: 'Entry confirmed',
          requestId: request.id,
          status: EntryRequestStatus.CONFIRMED,
          checkIn,
        };
      },
    );

    // Notify the organizer after the transaction commits.
    try {
      this.realtimeGateway.emitCheckInCreated({
        eventId: request.gate.eventId,
        gateId: request.gateId,
        checkInId: result.checkIn.id,
        createdAt: result.checkIn.createdAt,
      });
    } catch (error) {
      console.error(
        'Failed to emit check-in notification',
        error,
      );
    }

    // Notify the customer and authorized gate staff.
    try {
      await this.realtimeGateway.emitEntryRequestResolved({
        requestId: request.id,
        gateId: request.gateId,
        customerId: request.customerId,
        status: EntryRequestStatus.CONFIRMED,
        resolvedAt,
      });
    } catch (error) {
      console.error(
        'Failed to emit entry confirmation notification',
        error,
      );
    }

    return result;
  }

  async reject(
    requestId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const request = await this.findAuthorizedRequest(
      requestId,
      userId,
      userRole,
    );

    const resolvedAt = new Date();

    const updatedRequest =
      await this.prisma.entryRequest.updateMany({
        where: {
          id: request.id,
          status: EntryRequestStatus.PENDING,
        },
        data: {
          status: EntryRequestStatus.REJECTED,
          resolvedById: userId,
          resolvedAt,
        },
      });

    if (updatedRequest.count !== 1) {
      throw new ConflictException(
        'Entry request has already been resolved',
      );
    }

    try {
      await this.realtimeGateway.emitEntryRequestResolved({
        requestId: request.id,
        gateId: request.gateId,
        customerId: request.customerId,
        status: EntryRequestStatus.REJECTED,
        resolvedAt,
      });
    } catch (error) {
      console.error(
        'Failed to emit entry rejection notification',
        error,
      );
    }

    return {
      success: true,
      message: 'Entry request rejected',
      requestId: request.id,
      status: EntryRequestStatus.REJECTED,
    };
  }

  private async findCustomerTicket(
    ticketId: string,
    customerId: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        customerId,
      },
      include: {
        ticketType: {
          select: {
            eventId: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async findAvailableGates(
    ticketId: string,
    customerId: string,
  ) {
    const ticket = await this.findCustomerTicket(
      ticketId,
      customerId,
    );

    if (ticket.status !== TicketStatus.VALID) {
      throw new BadRequestException(
        'Ticket is not available for entry',
      );
    }

    return this.prisma.gate.findMany({
      where: {
        eventId: ticket.ticketType.eventId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findRequestsForTicket(
    ticketId: string,
    customerId: string,
  ) {
    // Verify that the ticket belongs to this customer.
    await this.findCustomerTicket(
      ticketId,
      customerId,
    );

    return this.prisma.entryRequest.findMany({
      where: {
        ticketId,
        customerId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        gate: {
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

  async create(
    ticketId: string,
    customerId: string,
    gateId: string,
  ) {
    const ticket = await this.findCustomerTicket(
      ticketId,
      customerId,
    );

    if (ticket.status !== TicketStatus.VALID) {
      throw new BadRequestException(
        'Ticket is not available for entry',
      );
    }

    const gate = await this.prisma.gate.findFirst({
      where: {
        id: gateId,
        eventId: ticket.ticketType.eventId,
      },
    });

    if (!gate) {
      throw new NotFoundException(
        'Gate not found for this event',
      );
    }

    let request;

    try {
      request = await this.prisma.$transaction(
        async (tx) => {
          // Lock the ticket row to prevent concurrent
          // QR validation from changing its status.
          await tx.$queryRaw`
            SELECT "id"
            FROM "Ticket"
            WHERE "id" = ${ticketId}
            FOR UPDATE
          `;

          // Check the ticket again while holding the lock.
          const currentTicket = await tx.ticket.findFirst({
            where: {
              id: ticketId,
              customerId,
            },
            select: {
              status: true,
            },
          });

          if (
            !currentTicket ||
            currentTicket.status !== TicketStatus.VALID
          ) {
            throw new BadRequestException(
              'Ticket is not available for entry',
            );
          }

          return tx.entryRequest.create({
            data: {
              ticketId,
              customerId,
              gateId,
            },
          });
        },
      );
    } catch (error: unknown) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This ticket already has a pending entry request',
        );
      }

      throw error;
    }

    try {
      await this.realtimeGateway.emitEntryRequestCreated({
        requestId: request.id,
        gateId: request.gateId,
        ticketId: request.ticketId,
        createdAt: request.createdAt,
      });
    } catch (error) {
      console.error(
        'Failed to notify gate staff about entry request',
        error,
      );
    }

    return request;
  }
  async findPendingForGate(
    gateId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const allowedRoles: UserRole[] = [
      UserRole.GATE_STAFF,
      UserRole.GATE_MANAGER,
      UserRole.SUPER_ADMIN,
    ];

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You cannot view gate entry requests',
      );
    }

    const gate = await this.prisma.gate.findUnique({
      where: { id: gateId },
      select: { id: true },
    });

    if (!gate) {
      throw new NotFoundException('Gate not found');
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
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
        throw new ForbiddenException(
          'You are not assigned to this gate',
        );
      }
    }

    return this.prisma.entryRequest.findMany({
      where: {
        gateId,
        status: EntryRequestStatus.PENDING,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        gateId: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketType: {
              select: {
                name: true,
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
}