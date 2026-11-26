import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import {
  InviteStatus,
  TicketStatus,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { InvitesService } from './invites.service.js';

const friend = { id: 'friend-1' };

function pendingInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invite-1',
    token: 'secret-token',
    status: InviteStatus.PENDING,
    ticketId: 'ticket-1',
    createdById: 'buyer-1',
    ...overrides,
  };
}

function setup() {
  const tx = {
    ticketInvite: { updateMany: vi.fn() },
    ticket: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  };

  const prisma = {
    ticketInvite: { findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };

  const service = new InvitesService(prisma as unknown as PrismaService);

  return { prisma, tx, service };
}

describe('InvitesService.claim', () => {
  it('returns 404 for an unknown token', async () => {
    const { prisma, service } = setup();
    prisma.ticketInvite.findUnique.mockResolvedValue(null);

    await expect(service.claim('nope', friend)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('does not let the buyer claim their own invite', async () => {
    const { prisma, service } = setup();
    prisma.ticketInvite.findUnique.mockResolvedValue(pendingInvite());

    await expect(
      service.claim('secret-token', { id: 'buyer-1' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses an invite that was already claimed', async () => {
    const { prisma, service } = setup();
    prisma.ticketInvite.findUnique.mockResolvedValue(
      pendingInvite({ status: InviteStatus.CLAIMED }),
    );

    await expect(service.claim('secret-token', friend)).rejects.toThrow(
      ConflictException,
    );
  });

  it('refuses when someone else claims at the same time', async () => {
    const { prisma, tx, service } = setup();
    prisma.ticketInvite.findUnique.mockResolvedValue(pendingInvite());
    tx.ticketInvite.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.claim('secret-token', friend)).rejects.toThrow(
      'Invite already claimed',
    );
    expect(tx.ticket.updateMany).not.toHaveBeenCalled();
  });

  it('refuses when the ticket is no longer valid', async () => {
    const { prisma, tx, service } = setup();
    prisma.ticketInvite.findUnique.mockResolvedValue(pendingInvite());
    tx.ticketInvite.updateMany.mockResolvedValue({ count: 1 });
    tx.ticket.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.claim('secret-token', friend)).rejects.toThrow(
      'Ticket is no longer available',
    );
  });

  it('moves the ticket to the account that claims it', async () => {
    const { prisma, tx, service } = setup();
    prisma.ticketInvite.findUnique.mockResolvedValue(pendingInvite());
    tx.ticketInvite.updateMany.mockResolvedValue({ count: 1 });
    tx.ticket.updateMany.mockResolvedValue({ count: 1 });
    tx.ticket.findUniqueOrThrow.mockResolvedValue({
      id: 'ticket-1',
      customerId: friend.id,
    });

    const ticket = await service.claim('secret-token', friend);

    expect(ticket).toEqual({ id: 'ticket-1', customerId: friend.id });
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket-1', status: TicketStatus.VALID },
      data: { customerId: friend.id },
    });
  });
});

describe('InvitesService.preview', () => {
  const row = (ticketStatus: TicketStatus, status = InviteStatus.PENDING) => ({
    status,
    ticket: {
      status: ticketStatus,
      ticketType: {
        name: 'VIP',
        event: { id: 'event-1', name: 'Festival', location: 'Maputo' },
      },
    },
  });

  it('is claimable only while pending and the ticket is valid', async () => {
    const { prisma, service } = setup();

    prisma.ticketInvite.findUnique.mockResolvedValue(row(TicketStatus.VALID));
    expect((await service.preview('t')).claimable).toBe(true);

    prisma.ticketInvite.findUnique.mockResolvedValue(row(TicketStatus.USED));
    expect((await service.preview('t')).claimable).toBe(false);

    prisma.ticketInvite.findUnique.mockResolvedValue(
      row(TicketStatus.VALID, InviteStatus.CLAIMED),
    );
    expect((await service.preview('t')).claimable).toBe(false);
  });
});
