import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { EntryRequestsService } from './entry-requests.service.js';

describe('Cancel entry request', () => {
  function setup() {
    const prisma = {
      ticket: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'ticket-1',
          customerId: 'customer-1',
        }),
      },
      entryRequest: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'request-1',
          gateId: 'gate-1',
          customerId: 'customer-1',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
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

  it('allows customers to cancel their pending request', async () => {
    const { service, prisma, realtimeGateway } = setup();

    const result = await service.cancel('ticket-1', 'request-1', 'customer-1');

    expect(result.status).toBe('CANCELLED');
    expect(prisma.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ticket-1', customerId: 'customer-1' } }),
    );
    expect(prisma.entryRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1', ticketId: 'ticket-1', customerId: 'customer-1' },
      }),
    );
    expect(prisma.entryRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'request-1',
        ticketId: 'ticket-1',
        customerId: 'customer-1',
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        resolvedById: 'customer-1',
        resolvedAt: expect.any(Date),
      },
    });
    expect(realtimeGateway.emitEntryRequestResolved).toHaveBeenCalledWith({
      requestId: 'request-1',
      gateId: 'gate-1',
      customerId: 'customer-1',
      status: 'CANCELLED',
      resolvedAt: expect.any(Date),
    });
  });

  it('prevents cancellation of another customer ticket', async () => {
    const { service, prisma, realtimeGateway } = setup();
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(
      service.cancel('ticket-1', 'request-1', 'another-customer'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.entryRequest.updateMany).not.toHaveBeenCalled();
    expect(realtimeGateway.emitEntryRequestResolved).not.toHaveBeenCalled();
  });

  it('prevents cancellation of another customer request', async () => {
    const { service, prisma, realtimeGateway } = setup();
    prisma.entryRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.cancel('ticket-1', 'another-request', 'customer-1'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.entryRequest.updateMany).not.toHaveBeenCalled();
    expect(realtimeGateway.emitEntryRequestResolved).not.toHaveBeenCalled();
  });

  it('prevents cancellation of an already resolved request', async () => {
    const { service, prisma, realtimeGateway } = setup();
    prisma.entryRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.cancel('ticket-1', 'request-1', 'customer-1'),
    ).rejects.toThrow(ConflictException);

    expect(realtimeGateway.emitEntryRequestResolved).not.toHaveBeenCalled();
  });
});
