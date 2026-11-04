import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards,
} from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { BarSosService } from './bar-sos.service.js';
import { AssignBarStaffDto } from './dto/assign-bar-staff.dto.js';
import { CreateBarSosDto } from './dto/create-bar-sos.dto.js';
import { ForwardBarSosDto } from './dto/forward-bar-sos.dto.js';

type AuthUser = { id: string; role: UserRole };

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarSosController {
  constructor(private readonly service: BarSosService) {}

  @Post('events/:eventId/bar-staff')
  @Roles(UserRole.ORGANIZER, UserRole.SUPER_ADMIN)
  assignStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AssignBarStaffDto,
  ) { return this.service.assignStaff(eventId, user, dto); }

  @Delete('events/:eventId/bar-staff/:userId')
  @Roles(UserRole.ORGANIZER, UserRole.SUPER_ADMIN)
  removeStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) staffUserId: string,
    @CurrentUser() user: AuthUser,
  ) { return this.service.removeStaff(eventId, staffUserId, user); }

  @Get('events/:eventId/bar-staff')
  @Roles(UserRole.ORGANIZER, UserRole.SUPER_ADMIN)
  listStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthUser,
  ) { return this.service.listStaff(eventId, user); }

  @Post('events/:eventId/bar-sos')
  @Roles(UserRole.BAR_STAFF)
  create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBarSosDto,
  ) { return this.service.create(eventId, user, dto); }

  @Get('bar-sos/mine')
  @Roles(UserRole.BAR_STAFF)
  mine(@CurrentUser() user: AuthUser) { return this.service.mine(user); }

  @Get('events/:eventId/bar-sos')
  @Roles(UserRole.ORGANIZER, UserRole.SUPER_ADMIN)
  listForEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthUser,
  ) { return this.service.listForEvent(eventId, user); }

  @Post('bar-sos/:id/forward')
  @Roles(UserRole.ORGANIZER, UserRole.SUPER_ADMIN)
  forward(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ForwardBarSosDto,
  ) { return this.service.forward(id, user, dto); }

  @Get('bar-sos/assigned')
  @Roles(UserRole.GATE_MANAGER)
  assigned(@CurrentUser() user: AuthUser) { return this.service.assigned(user); }

  @Post('bar-sos/:id/resolve')
  @Roles(UserRole.GATE_MANAGER)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) { return this.service.resolve(id, user); }
}
