import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

import { CreateEntryRequestDto } from './dto/create-entry-request.dto.js';
import { EntryRequestsService } from './entry-requests.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class EntryRequestsController {
  constructor(
    private readonly entryRequestsService: EntryRequestsService,
  ) {}

  @Get(':id/entry-gates')
  findAvailableGates(
    @Param('id') ticketId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.entryRequestsService.findAvailableGates(
      ticketId,
      user.id,
    );
  }

  @Get(':id/entry-requests')
  findRequests(
    @Param('id') ticketId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.entryRequestsService.findRequestsForTicket(
      ticketId,
      user.id,
    );
  }

  @Post(':id/entry-requests')
  create(
    @Param('id') ticketId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateEntryRequestDto,
  ) {
    return this.entryRequestsService.create(
      ticketId,
      user.id,
      body.gateId,
    );
  }
}