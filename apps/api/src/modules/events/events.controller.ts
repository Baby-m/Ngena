import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventsService } from './events.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.findMine(
      user.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ORGANIZER,
    UserRole.SUPER_ADMIN,
  )
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateEventDto,
  ) {
    return this.eventsService.create(
      user.id,
      body,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateEventDto,
  ) {
    return this.eventsService.update(
      id,
      user,
      body,
    );
  }
}
