import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BarSosStatus, UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BarSosService } from './bar-sos.service.js';

describe('BarSosService', () => {
  function setup() {
    const prisma = {
      barStaff: { findUnique: vi.fn() },
      barSos: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
      event: { findUnique: vi.fn() },
      user: { findUnique: vi.fn() },
      gateStaff: { findFirst: vi.fn() },
    };
    const realtime = { emitBarSosUpdate: vi.fn() };
    const service = new BarSosService(
      prisma as unknown as PrismaService,
      realtime as unknown as RealtimeGateway,
    );
    return { prisma, realtime, service };
  }

  it('blocks SOS from staff not assigned to event', async () => {
    const { prisma, service } = setup();
    prisma.barStaff.findUnique.mockResolvedValue(null);
    await expect(service.create('event-1', { id: 'staff-1', role: UserRole.BAR_STAFF }, {}))
      .rejects.toThrow(ForbiddenException);
    expect(prisma.barSos.create).not.toHaveBeenCalled();
  });

  it('creates SOS and notifies only after persistence', async () => {
    const { prisma, service, realtime } = setup();
    prisma.barStaff.findUnique.mockResolvedValue({ id: 'assignment-1' });
    prisma.barSos.create.mockResolvedValue({
      id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1',
      status: BarSosStatus.PENDING, message: 'Ajuda', createdAt: new Date(),
    });
    const result = await service.create(
      'event-1', { id: 'staff-1', role: UserRole.BAR_STAFF }, { message: 'Ajuda' },
    );
    expect(result.status).toBe(BarSosStatus.PENDING);
    expect(prisma.barSos.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ activeKey: 'event-1:staff-1' }),
    }));
    expect(realtime.emitBarSosUpdate).toHaveBeenCalledOnce();
  });

  it('prevents forwarding to a manager not assigned to event', async () => {
    const { prisma, service } = setup();
    prisma.barSos.findUnique.mockResolvedValue({
      id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1',
    });
    prisma.event.findUnique.mockResolvedValue({ id: 'event-1', organizerId: 'organizer-1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'manager-1', role: UserRole.GATE_MANAGER });
    prisma.gateStaff.findFirst.mockResolvedValue(null);
    await expect(service.forward('sos-1', { id: 'organizer-1', role: UserRole.ORGANIZER }, {
      managerId: 'manager-1',
    })).rejects.toThrow('Manager is not assigned to this event');
    expect(prisma.barSos.updateMany).not.toHaveBeenCalled();
  });

  it('allows only one forward transition', async () => {
    const { prisma, service } = setup();
    prisma.barSos.findUnique.mockResolvedValue({
      id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1',
    });
    prisma.event.findUnique.mockResolvedValue({ id: 'event-1', organizerId: 'organizer-1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'manager-1', role: UserRole.GATE_MANAGER });
    prisma.gateStaff.findFirst.mockResolvedValue({ id: 'assignment-1' });
    prisma.barSos.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.forward('sos-1', { id: 'organizer-1', role: UserRole.ORGANIZER }, {
      managerId: 'manager-1',
    })).rejects.toThrow(ConflictException);
  });
});
