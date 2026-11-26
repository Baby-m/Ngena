import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
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

@Controller('entry-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.GATE_STAFF,
  UserRole.GATE_MANAGER,
  UserRole.SUPER_ADMIN,
)
export class EntryRequestDecisionsController {
  constructor(
    private readonly entryRequestsService:
      EntryRequestsService,
  ) {}

  @Post(':id/confirm')
  confirm(
    @Param('id', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.entryRequestsService.confirm(
      requestId,
      user.id,
      user.role,
    );
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.entryRequestsService.reject(
      requestId,
      user.id,
      user.role,
    );
  }
}
