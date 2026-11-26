import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { TicketStatus, UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { CheckInsService } from './checkins.service.js';

describe('CheckInsService realtime failure', () => {
  it('returns the committed check-in even when realtime emission fails', async () => {
    const ticket = {
      id: 'ticket-1',
      status: TicketStatus.VALID,
      ticketType: { event: { id: 'event-1' } },
    };
    const checkIn = { id: 'checkin-1', createdAt: new Date() };
    const tx = {
      ticket: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({
          ...ticket, status: TicketStatus.USED,
        }),
      },
      checkIn: { create: vi.fn().mockResolvedValue(checkIn) },
      entryRequest: { updateManyAndReturn: vi.fn().mockResolvedValue([]) },
    };
    let committed = false;
    const prisma = {
      ticket: { findUnique: vi.fn().mockResolvedValue(ticket) },
      gate: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'gate-1', name: 'Gate A', eventId: 'event-1',
        }),
      },
      gateStaff: { findUnique: vi.fn().mockResolvedValue({ id: 'assignment-1' }) },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => {
        const result = await callback(tx);
        committed = true;
        return result;
      }),
    };
    const realtime = {
      emitCheckInCreated: vi.fn(() => {
        throw new Error('Socket unavailable');
      }),
    };
    const logger = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    try {
      const service = new CheckInsService(
        prisma as unknown as PrismaService,
        realtime as unknown as RealtimeGateway,
      );
      const result = await service.validate('staff-1', UserRole.GATE_STAFF, {
        code: 'TICKET-1', gateId: 'gate-1',
      });
      expect(committed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.checkIn).toEqual(checkIn);
      expect(result.ticket.status).toBe(TicketStatus.USED);
      expect(tx.checkIn.create).toHaveBeenCalledOnce();
      expect(realtime.emitCheckInCreated).toHaveBeenCalledWith({
        eventId: 'event-1', gateId: 'gate-1',
        checkInId: checkIn.id, createdAt: checkIn.createdAt,
      });
      expect(logger).toHaveBeenCalledOnce();
      expect(prisma.$transaction.mock.invocationCallOrder[0])
        .toBeLessThan(realtime.emitCheckInCreated.mock.invocationCallOrder[0]);
    } finally {
      logger.mockRestore();
    }
  });
});
