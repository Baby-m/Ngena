import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { EventStatus, UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { EventsService } from './events.service.js';

const owner = { id: 'owner-1', role: UserRole.ORGANIZER };

function setup() {
  const tx = {
    event: { create: vi.fn(), findUniqueOrThrow: vi.fn() },
    ticketType: { createMany: vi.fn() },
  };

  const prisma = {
    event: { findUnique: vi.fn(), deleteMany: vi.fn() },
    ticket: { count: vi.fn() },
    payment: { count: vi.fn() },
    ticketType: { findMany: vi.fn() },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };

  const service = new EventsService(prisma as unknown as PrismaService);

  return { prisma, tx, service };
}

describe('EventsService.remove', () => {
  it('hides events that belong to another organizer', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizerId: 'someone-else',
      status: EventStatus.DRAFT,
    });

    await expect(service.remove('event-1', owner)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.event.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses events that are not draft', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizerId: owner.id,
      status: EventStatus.PUBLISHED,
    });

    await expect(service.remove('event-1', owner)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.event.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses draft events with sales activity', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizerId: owner.id,
      status: EventStatus.DRAFT,
    });
    prisma.ticket.count.mockResolvedValue(0);
    prisma.payment.count.mockResolvedValue(2);

    await expect(service.remove('event-1', owner)).rejects.toThrow(
      'Events with sales activity cannot be deleted',
    );
    expect(prisma.event.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes a draft event without sales', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizerId: owner.id,
      status: EventStatus.DRAFT,
    });
    prisma.ticket.count.mockResolvedValue(0);
    prisma.payment.count.mockResolvedValue(0);
    prisma.event.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.remove('event-1', owner);

    expect(result).toEqual({ message: 'Event deleted' });
    expect(prisma.event.deleteMany).toHaveBeenCalledWith({
      where: { id: 'event-1', status: EventStatus.DRAFT },
    });
  });
});

describe('EventsService.duplicate', () => {
  it('copies the event as draft with the original ticket capacity', async () => {
    const { prisma, tx, service } = setup();
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      name: 'Festival',
      description: null,
      location: 'Maputo',
      startsAt: new Date('2026-12-31T16:00:00.000Z'),
      endsAt: null,
      status: EventStatus.PUBLISHED,
      organizerId: owner.id,
      organizer: { id: owner.id, name: 'Organizador' },
    });
    prisma.ticketType.findMany.mockResolvedValue([
      {
        name: 'VIP',
        description: null,
        price: '2500',
        quantity: 48,
        _count: { tickets: 2 },
      },
    ]);
    tx.event.create.mockResolvedValue({ id: 'copy-1' });
    tx.event.findUniqueOrThrow.mockResolvedValue({ id: 'copy-1' });

    await service.duplicate('event-1', owner);

    expect(tx.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Festival (cópia)',
        status: EventStatus.DRAFT,
        organizerId: owner.id,
      }),
    });
    expect(tx.ticketType.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          eventId: 'copy-1',
          name: 'VIP',
          quantity: 50,
        }),
      ],
    });
  });
});
