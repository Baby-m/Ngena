import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { EntryRequestsService } from './entry-requests.service.js';
import { UserRole } from '../../../generated/prisma/client.js';

describe('EntryRequestsService', () => {
  function setup() {
    const prisma = {
      ticket: {
        findFirst: vi.fn(),
      },
      entryRequest: {
        findMany: vi.fn(),
      },
    };

    const realtimeGateway = {};

    const service = new EntryRequestsService(
      prisma as unknown as PrismaService,
      realtimeGateway as RealtimeGateway,
    );

    return { service, prisma };
  }

  it('allows customers to view requests for their own ticket', async () => {
    const { service, prisma } = setup();

    prisma.ticket.findFirst.mockResolvedValue({
      id: 'ticket-1',
      customerId: 'customer-1',
      ticketType: {
        eventId: 'event-1',
      },
    });

    prisma.entryRequest.findMany.mockResolvedValue([
      {
        id: 'request-1',
        status: 'PENDING',
      },
    ]);

    const result = await service.findRequestsForTicket(
      'ticket-1',
      'customer-1',
    );

    expect(result).toHaveLength(1);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'ticket-1',
          customerId: 'customer-1',
        },
      }),
    );

    expect(prisma.entryRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ticketId: 'ticket-1',
          customerId: 'customer-1',
        },
      }),
    );
  });

  it('prevents customers from viewing requests for another ticket', async () => {
    const { service, prisma } = setup();

    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(
      service.findRequestsForTicket(
        'ticket-1',
        'another-customer',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.entryRequest.findMany).not.toHaveBeenCalled();
  });
  describe('reject entry request', () => {
  function setupRejection() {
    const prisma = {
      entryRequest: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      gateStaff: {
        findUnique: vi.fn(),
      },
    };

    const realtimeGateway = {
      emitEntryRequestResolved: vi.fn().mockResolvedValue(undefined),
    };

    const service = new EntryRequestsService(
      prisma as unknown as PrismaService,
      realtimeGateway as unknown as RealtimeGateway,
    );

    return { service, prisma, realtimeGateway };
  }

  it('allows assigned gate staff to reject a pending request', async () => {
    const { service, prisma, realtimeGateway } = setupRejection();

    prisma.entryRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      ticketId: 'ticket-1',
      gateId: 'gate-1',
      customerId: 'customer-1',
    });

    prisma.gateStaff.findUnique.mockResolvedValue({
      id: 'assignment-1',
    });

    prisma.entryRequest.updateMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.reject(
      'request-1',
      'staff-1',
      UserRole.GATE_STAFF,
    );

    expect(result.status).toBe('REJECTED');

    expect(prisma.entryRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'request-1',
          status: 'PENDING',
        },
      }),
    );

    expect(
      realtimeGateway.emitEntryRequestResolved,
    ).toHaveBeenCalledOnce();
    });

    it('prevents staff from rejecting requests at unassigned gates', async () => {
      const { service, prisma } = setupRejection();

      prisma.entryRequest.findUnique.mockResolvedValue({
        id: 'request-1',
        ticketId: 'ticket-1',
        gateId: 'gate-1',
        customerId: 'customer-1',
      });

      prisma.gateStaff.findUnique.mockResolvedValue(null);

      await expect(
        service.reject(
          'request-1',
          'unassigned-staff',
          UserRole.GATE_STAFF,
        ),
      ).rejects.toThrow(
        'You are not assigned to this gate',
      );

      expect(
        prisma.entryRequest.updateMany,
      ).not.toHaveBeenCalled();
    });
  });
});
