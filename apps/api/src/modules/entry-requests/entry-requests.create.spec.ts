import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { EntryRequestsService } from './entry-requests.service.js';

describe('Entry request retry protection', () => {
  function setup(status: 'PENDING' | 'REJECTED' | null) {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'ticket-1' }]),
      ticket: { findFirst: vi.fn().mockResolvedValue({ status: 'VALID' }) },
      entryRequest: {
        findFirst: vi.fn().mockResolvedValue(status ? { status } : null),
        create: vi.fn().mockResolvedValue({
          id: 'request-1', gateId: 'gate-1', ticketId: 'ticket-1',
          createdAt: new Date(),
        }),
      },
    };
    const prisma = {
      ticket: { findFirst: vi.fn().mockResolvedValue({
        status: 'VALID', ticketType: { eventId: 'event-1' },
      }) },
      gate: { findFirst: vi.fn().mockResolvedValue({ id: 'gate-1' }) },
      $transaction: (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    };
    const realtime = { emitEntryRequestCreated: vi.fn().mockResolvedValue(undefined) };
    const service = new EntryRequestsService(
      prisma as unknown as PrismaService,
      realtime as unknown as RealtimeGateway,
    );
    return { service, tx, realtime };
  }

  it.each(['PENDING', 'REJECTED'] as const)('blocks a %s request', async (status) => {
    const { service, tx, realtime } = setup(status);
    await expect(service.create('ticket-1', 'customer-1', 'gate-1'))
      .rejects.toThrow(ConflictException);
    expect(tx.entryRequest.create).not.toHaveBeenCalled();
    expect(realtime.emitEntryRequestCreated).not.toHaveBeenCalled();
  });

  it('creates a request when no blocking request exists', async () => {
    const { service, tx, realtime } = setup(null);
    await service.create('ticket-1', 'customer-1', 'gate-1');
    expect(tx.entryRequest.findFirst).toHaveBeenCalledWith({
      where: {
        ticketId: 'ticket-1',
        OR: [
          { status: 'PENDING' },
          { status: 'REJECTED', resolvedAt: { gt: expect.any(Date) } },
        ],
      },
      select: { status: true },
    });
    expect(tx.entryRequest.create).toHaveBeenCalledOnce();
    expect(realtime.emitEntryRequestCreated).toHaveBeenCalledOnce();
  });
});
