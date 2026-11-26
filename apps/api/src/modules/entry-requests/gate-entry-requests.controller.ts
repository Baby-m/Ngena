import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../../../generated/prisma/client.js';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator.js';

import {
  Roles,
} from '../auth/decorators/roles.decorator.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard.js';

import {
  RolesGuard,
} from '../auth/guards/roles.guard.js';

import {
  EntryRequestsService,
} from './entry-requests.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('gates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.GATE_STAFF,
  UserRole.GATE_MANAGER,
  UserRole.SUPER_ADMIN,
)
export class GateEntryRequestsController {
  constructor(
    private readonly entryRequestsService:
      EntryRequestsService,
  ) {}

  @Get(':gateId/entry-requests')
  findPending(
    @Param('gateId') gateId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.entryRequestsService.findPendingForGate(
      gateId,
      user.id,
      user.role,
    );
  }
}