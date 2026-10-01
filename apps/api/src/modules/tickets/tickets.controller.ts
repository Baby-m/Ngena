import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TicketsService } from './tickets.service.js';

type AuthUser = {
  id: string;
};

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService:
      TicketsService,
  ) {}

  @Get('mine')
  findMine(
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.findMine(
      user.id,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.findOneForUser(
      id,
      user.id,
    );
  }
}
