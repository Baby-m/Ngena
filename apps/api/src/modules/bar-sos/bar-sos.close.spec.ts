import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BarSosStatus, UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BarSosService } from './bar-sos.service.js';

const staff = { id: 'staff-1', role: UserRole.BAR_STAFF };
const organizer = { id: 'org-1', role: UserRole.ORGANIZER };

function setup(status: BarSosStatus = BarSosStatus.CANCELLED) {
  const closed = { id: 'sos-1', eventId: 'event-1', requestedById: staff.id,
    assignedManagerId: 'manager-1', status };
  const prisma = {
    event: { findUnique: vi.fn().mockResolvedValue({ id: 'event-1', organizerId: organizer.id }) },
    barSos: {
      findUnique: vi.fn().mockResolvedValue({ eventId: 'event-1', requestedById: staff.id }),
      updateManyAndReturn: vi.fn().mockResolvedValue([closed]),
    },
  };
  const realtime = { emitBarSosUpdate: vi.fn() };
  const service = new BarSosService(prisma as unknown as PrismaService, realtime as unknown as RealtimeGateway);
  return { service, prisma, realtime, closed };
}

describe('Closing bar SOS', () => {
  it('allows the requester to cancel and frees the active key', async () => {
    const { service, prisma, realtime, closed } = setup();
    expect(await service.cancel('sos-1', staff)).toEqual({ id: 'sos-1', status: BarSosStatus.CANCELLED });
    expect(prisma.barSos.updateManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'sos-1', eventId: 'event-1', requestedById: staff.id,
        status: { in: [BarSosStatus.PENDING, BarSosStatus.FORWARDED] } },
      data: { status: BarSosStatus.CANCELLED, resolvedById: staff.id, resolvedAt: expect.any(Date), activeKey: null },
    }));
    expect(realtime.emitBarSosUpdate).toHaveBeenCalledWith(closed);
  });
  it('rejects cancellation by another bar employee', async () => {
    const { service, prisma } = setup();
    await expect(service.cancel('sos-1', { ...staff, id: 'other' })).rejects.toThrow(NotFoundException);
    expect(prisma.barSos.updateManyAndReturn).not.toHaveBeenCalled();
  });
  it('allows the event organizer to cancel', async () => {
    const { service } = setup();
    expect(await service.cancel('sos-1', organizer)).toEqual({ id: 'sos-1', status: BarSosStatus.CANCELLED });
  });
  it('allows the event organizer to resolve', async () => {
    const { service } = setup(BarSosStatus.RESOLVED);
    expect(await service.resolve('sos-1', organizer)).toEqual({ id: 'sos-1', status: BarSosStatus.RESOLVED });
  });
  it('rejects another event organizer', async () => {
    const { service, prisma } = setup();
    await expect(service.resolve('sos-1', { ...organizer, id: 'other' })).rejects.toThrow(NotFoundException);
    expect(prisma.barSos.updateManyAndReturn).not.toHaveBeenCalled();
  });
  it('rejects a second closure without notifying', async () => {
    const { service, prisma, realtime } = setup();
    prisma.barSos.updateManyAndReturn.mockResolvedValue([]);
    await expect(service.cancel('sos-1', staff)).rejects.toThrow(ConflictException);
    expect(realtime.emitBarSosUpdate).not.toHaveBeenCalled();
  });
});
