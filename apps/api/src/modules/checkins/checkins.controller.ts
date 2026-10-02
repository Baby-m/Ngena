import {
  Body,
  Controller,
  Get,
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
  CheckInsService,
} from './checkins.service.js';

import {
  ValidateTicketDto,
} from './dto/validate-ticket.dto.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('checkins')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  UserRole.GATE_MANAGER,
  UserRole.GATE_STAFF,
  UserRole.SUPER_ADMIN,
)
export class CheckInsController {
  constructor(
    private readonly checkInsService:
      CheckInsService,
  ) {}

  @Get('mine')
  findMine(
    @CurrentUser()
    user: AuthUser,
  ) {
    return this.checkInsService
      .findMine(
        user.id,
      );
  }

  @Post('validate')
  validate(
    @CurrentUser()
    user: AuthUser,

    @Body()
    body: ValidateTicketDto,
  ) {
    return this.checkInsService
      .validate(
        user.id,
        user.role,
        body,
      );
  }
}
