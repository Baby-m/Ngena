import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BarSosCategory, BarSosStatus, UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BarSosService } from './bar-sos.service.js';

describe('BarSosService', () => {
  function setup() {
    const prisma = {
      barStaff: { findUnique: vi.fn(), findMany: vi.fn() },
      barSos: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
      event: { findUnique: vi.fn() },
      user: { findUnique: vi.fn(), findMany: vi.fn() },
      gateStaff: { findFirst: vi.fn(), findMany: vi.fn() },
    };
    const realtime = { emitBarSosUpdate: vi.fn() };
    const service = new BarSosService(
      prisma as unknown as PrismaService,
      realtime as unknown as RealtimeGateway,
    );
    return { prisma, realtime, service };
  }

  it('lists only SOS assigned to the manager in their current events', async () => {
    const { prisma, service } = setup();
    prisma.gateStaff.findMany.mockResolvedValue([{ gate: { eventId: 'event-1' } }, { gate: { eventId: 'event-1' } }]);
    prisma.barSos.findMany.mockResolvedValue([]);
    await service.assigned({ id: 'manager-1', role: UserRole.GATE_MANAGER });
    expect(prisma.gateStaff.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'manager-1' } }));
    expect(prisma.barSos.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { assignedManagerId: 'manager-1', eventId: { in: ['event-1'] },
        status: { in: [BarSosStatus.FORWARDED, BarSosStatus.RESOLVED, BarSosStatus.CANCELLED] } },
    }));
  });

  it('blocks resolution by a manager removed from the event', async () => {
    const { prisma, service } = setup();
    prisma.barSos.findUnique.mockResolvedValue({ id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1', assignedManagerId: 'manager-1' });
    prisma.gateStaff.findFirst.mockResolvedValue(null);
    await expect(service.resolve('sos-1', { id: 'manager-1', role: UserRole.GATE_MANAGER })).rejects.toThrow(ForbiddenException);
    expect(prisma.barSos.updateMany).not.toHaveBeenCalled();
  });

  it('allows the assigned manager to resolve and release the active key', async () => {
    const { prisma, service, realtime } = setup();
    prisma.barSos.findUnique.mockResolvedValue({ id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1', assignedManagerId: 'manager-1' });
    prisma.gateStaff.findFirst.mockResolvedValue({ id: 'assignment-1' });
    prisma.barSos.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.resolve('sos-1', { id: 'manager-1', role: UserRole.GATE_MANAGER })).resolves.toEqual({ id: 'sos-1', status: BarSosStatus.RESOLVED });
    expect(prisma.barSos.updateMany).toHaveBeenCalledWith({
      where: { id: 'sos-1', status: BarSosStatus.FORWARDED, assignedManagerId: 'manager-1' },
      data: { status: BarSosStatus.RESOLVED, resolvedById: 'manager-1', resolvedAt: expect.any(Date), activeKey: null },
    });
    expect(realtime.emitBarSosUpdate).toHaveBeenCalledOnce();
  });

  it('lists only bar staff candidates for the event owner', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({ id: 'event-1', organizerId: 'owner' });
    prisma.user.findMany.mockResolvedValue([{ id: 'staff-1', name: 'Staff' }]);
    await expect(service.staffCandidates('event-1', { id: 'owner', role: UserRole.ORGANIZER }))
      .resolves.toEqual([{ id: 'staff-1', name: 'Staff' }]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: UserRole.BAR_STAFF }, select: { id: true, name: true }, orderBy: { name: 'asc' },
    });
  });

  it('does not disclose candidates to another organizer', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({ id: 'event-1', organizerId: 'owner' });
    await expect(service.staffCandidates('event-1', { id: 'other', role: UserRole.ORGANIZER }))
      .rejects.toThrow(NotFoundException);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('lists only events assigned to the requesting bar staff member', async () => {
    const { prisma, service } = setup();
    prisma.barStaff.findMany.mockResolvedValue([{ event: { id: 'event-1' } }]);
    await expect(service.myEvents({ id: 'staff-1', role: UserRole.BAR_STAFF }))
      .resolves.toEqual([{ event: { id: 'event-1' } }]);
    expect(prisma.barStaff.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'staff-1' },
    }));
  });

  it('blocks SOS from staff not assigned to event', async () => {
    const { prisma, service } = setup();
    prisma.barStaff.findUnique.mockResolvedValue(null);
    await expect(service.create('event-1', { id: 'staff-1', role: UserRole.BAR_STAFF }, { category: BarSosCategory.OTHER }))
      .rejects.toThrow(ForbiddenException);
    expect(prisma.barSos.create).not.toHaveBeenCalled();
  });

  it('creates SOS and notifies only after persistence', async () => {
    const { prisma, service, realtime } = setup();
    prisma.barStaff.findUnique.mockResolvedValue({ id: 'assignment-1' });
    prisma.barSos.create.mockResolvedValue({
      id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1',
      status: BarSosStatus.PENDING, category: BarSosCategory.SECURITY, message: 'Ajuda', createdAt: new Date(),
    });
    const result = await service.create(
      'event-1', { id: 'staff-1', role: UserRole.BAR_STAFF }, { category: BarSosCategory.SECURITY, message: '  Ajuda  ' },
    );
    expect(result.status).toBe(BarSosStatus.PENDING);
    expect(result.category).toBe(BarSosCategory.SECURITY);
    expect(prisma.barSos.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ activeKey: 'event-1:staff-1', category: BarSosCategory.SECURITY, message: 'Ajuda' }),
    }));
    expect(realtime.emitBarSosUpdate).toHaveBeenCalledOnce();
    expect(prisma.barSos.create.mock.invocationCallOrder[0]).toBeLessThan(realtime.emitBarSosUpdate.mock.invocationCallOrder[0]);
  });

  it('stores an omitted description as null', async () => {
    const { prisma, service } = setup();
    prisma.barStaff.findUnique.mockResolvedValue({ id: 'assignment-1' });
    prisma.barSos.create.mockResolvedValue({
      id: 'sos-1', eventId: 'event-1', requestedById: 'staff-1',
      status: BarSosStatus.PENDING, category: BarSosCategory.ICE_SHORTAGE, message: null, createdAt: new Date(),
    });
    await service.create('event-1', { id: 'staff-1', role: UserRole.BAR_STAFF }, { category: BarSosCategory.ICE_SHORTAGE });
    expect(prisma.barSos.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ category: BarSosCategory.ICE_SHORTAGE, message: null }),
    }));
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
