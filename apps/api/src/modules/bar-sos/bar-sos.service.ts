import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BarSosStatus, UserRole } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { AssignBarStaffDto } from './dto/assign-bar-staff.dto.js';
import { CreateBarSosDto } from './dto/create-bar-sos.dto.js';
import { ForwardBarSosDto } from './dto/forward-bar-sos.dto.js';

type AuthUser = { id: string; role: UserRole };

@Injectable()
export class BarSosService {
  private readonly logger = new Logger(BarSosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async requireEventManager(eventId: string, user: AuthUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true },
    });
    if (!event || (event.organizerId !== user.id && user.role !== UserRole.SUPER_ADMIN)) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async assignStaff(eventId: string, user: AuthUser, dto: AssignBarStaffDto) {
    await this.requireEventManager(eventId, user);
    const employee = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, role: true },
    });
    if (!employee) throw new NotFoundException('User not found');
    if (employee.role !== UserRole.BAR_STAFF) {
      throw new BadRequestException('User must have BAR_STAFF role');
    }
    return this.prisma.barStaff.upsert({
      where: { eventId_userId: { eventId, userId: dto.userId } },
      create: { eventId, userId: dto.userId },
      update: {},
      select: {
        id: true, eventId: true, userId: true, createdAt: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async removeStaff(eventId: string, staffUserId: string, user: AuthUser) {
    await this.requireEventManager(eventId, user);
    const result = await this.prisma.barStaff.deleteMany({
      where: { eventId, userId: staffUserId },
    });
    if (result.count === 0) throw new NotFoundException('Assignment not found');
    return { message: 'Bar staff removed from event' };
  }

  async listStaff(eventId: string, user: AuthUser) {
    await this.requireEventManager(eventId, user);
    return this.prisma.barStaff.findMany({
      where: { eventId },
      select: {
        id: true, eventId: true, userId: true, createdAt: true,
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(eventId: string, user: AuthUser, dto: CreateBarSosDto) {
    const assignment = await this.prisma.barStaff.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
      select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('Not assigned to this event bar');
    const message = dto.message?.trim() || 'SOS: assistência necessária no bar';
    let sos;
    try {
      sos = await this.prisma.barSos.create({
        data: {
          eventId,
          requestedById: user.id,
          message,
          activeKey: `${eventId}:${user.id}`,
        },
        select: {
          id: true, eventId: true, requestedById: true, message: true,
          status: true, createdAt: true,
        },
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('An active SOS already exists for this bar staff member');
      }
      throw error;
    }
    this.notify({
      id: sos.id, eventId: sos.eventId, requestedById: sos.requestedById,
      status: sos.status,
    });
    return sos;
  }

  async mine(user: AuthUser) {
    return this.prisma.barSos.findMany({
      where: { requestedById: user.id },
      select: {
        id: true, eventId: true, message: true, status: true,
        assignedManagerId: true, createdAt: true, forwardedAt: true, resolvedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForEvent(eventId: string, user: AuthUser) {
    await this.requireEventManager(eventId, user);
    return this.prisma.barSos.findMany({
      where: { eventId },
      select: {
        id: true, eventId: true, message: true, status: true,
        requestedById: true, assignedManagerId: true, forwardedById: true,
        resolvedById: true, createdAt: true, forwardedAt: true, resolvedAt: true,
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async forward(id: string, user: AuthUser, dto: ForwardBarSosDto) {
    const sos = await this.prisma.barSos.findUnique({
      where: { id },
      select: { id: true, eventId: true, requestedById: true },
    });
    if (!sos) throw new NotFoundException('SOS not found');
    await this.requireEventManager(sos.eventId, user);

    const manager = await this.prisma.user.findUnique({
      where: { id: dto.managerId }, select: { id: true, role: true },
    });
    if (!manager || manager.role !== UserRole.GATE_MANAGER) {
      throw new BadRequestException('Target must be an existing GATE_MANAGER');
    }
    const assignment = await this.prisma.gateStaff.findFirst({
      where: { userId: dto.managerId, gate: { eventId: sos.eventId } },
      select: { id: true },
    });
    if (!assignment) throw new BadRequestException('Manager is not assigned to this event');

    const updated = await this.prisma.barSos.updateMany({
      where: { id, status: BarSosStatus.PENDING },
      data: {
        status: BarSosStatus.FORWARDED,
        assignedManagerId: dto.managerId,
        forwardedById: user.id,
        forwardedAt: new Date(),
      },
    });
    if (updated.count !== 1) throw new ConflictException('SOS has already been forwarded or resolved');
    this.notify({
      id, eventId: sos.eventId, requestedById: sos.requestedById,
      assignedManagerId: dto.managerId, status: BarSosStatus.FORWARDED,
    });
    return { id, status: BarSosStatus.FORWARDED, assignedManagerId: dto.managerId };
  }

  async assigned(user: AuthUser) {
    const assignments = await this.prisma.gateStaff.findMany({
      where: { userId: user.id },
      select: { gate: { select: { eventId: true } } },
    });
    const eventIds = [...new Set(assignments.map((a) => a.gate.eventId))];
    if (eventIds.length === 0) return [];
    return this.prisma.barSos.findMany({
      where: {
        assignedManagerId: user.id,
        eventId: { in: eventIds },
        status: { in: [BarSosStatus.FORWARDED, BarSosStatus.RESOLVED] },
      },
      select: {
        id: true, eventId: true, message: true, status: true,
        requestedById: true, createdAt: true, forwardedAt: true, resolvedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: string, user: AuthUser) {
    const sos = await this.prisma.barSos.findUnique({
      where: { id },
      select: { id: true, eventId: true, requestedById: true, assignedManagerId: true },
    });
    if (!sos || sos.assignedManagerId !== user.id) {
      throw new NotFoundException('Assigned SOS not found');
    }
    const assignment = await this.prisma.gateStaff.findFirst({
      where: { userId: user.id, gate: { eventId: sos.eventId } },
      select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('Not assigned to this event');
    const updated = await this.prisma.barSos.updateMany({
      where: { id, status: BarSosStatus.FORWARDED, assignedManagerId: user.id },
      data: {
        status: BarSosStatus.RESOLVED,
        resolvedById: user.id,
        resolvedAt: new Date(),
        activeKey: null,
      },
    });
    if (updated.count !== 1) throw new ConflictException('SOS is not awaiting resolution');
    this.notify({
      id, eventId: sos.eventId, requestedById: sos.requestedById,
      assignedManagerId: user.id, status: BarSosStatus.RESOLVED,
    });
    return { id, status: BarSosStatus.RESOLVED };
  }

  private notify(payload: {
    id: string;
    eventId: string;
    requestedById: string;
    assignedManagerId?: string;
    status: BarSosStatus;
  }) {
    try {
      this.realtime.emitBarSosUpdate(payload);
    } catch (error: unknown) {
      this.logger.warn(`SOS ${payload.id} saved but notification failed: ${String(error)}`);
    }
  }
}
