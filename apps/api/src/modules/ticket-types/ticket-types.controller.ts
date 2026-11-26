import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  Roles,
} from '../auth/decorators/roles.decorator.js';

import {
  RolesGuard,
} from '../auth/guards/roles.guard.js';

import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto.js';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto.js';
import { TicketTypesService } from './ticket-types.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller()
export class TicketTypesController {
  constructor(
    private readonly ticketTypesService:
      TicketTypesService,
  ) {}

  @Get('events/:eventId/ticket-types')
  findByEvent(
    @Param('eventId') eventId: string,
  ) {
    return this.ticketTypesService.findByEvent(
      eventId,
    );
  }

  @Get(
    'events/:eventId/ticket-types/manage',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.ORGANIZER,
    UserRole.SUPER_ADMIN,
  )
  findByEventForManagement(
    @Param('eventId')
    eventId: string,

    @CurrentUser()
    user: AuthUser,
  ) {
    return this.ticketTypesService
      .findByEventForManagement(
        eventId,
        user,
      );
  }

  @Post('events/:eventId/ticket-types')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateTicketTypeDto,
  ) {
    return this.ticketTypesService.create(
      eventId,
      user,
      body,
    );
  }

  @Patch('ticket-types/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateTicketTypeDto,
  ) {
    return this.ticketTypesService.update(
      id,
      user,
      body,
    );
  }

  @Delete('ticket-types/:id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketTypesService.remove(
      id,
      user,
    );
  }
}
