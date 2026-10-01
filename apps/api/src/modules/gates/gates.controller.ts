import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AssignStaffDto } from './dto/assign-staff.dto.js';
import { CreateGateDto } from './dto/create-gate.dto.js';
import { GatesService } from './gates.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller()
export class GatesController {
  constructor(
    private readonly gatesService:
      GatesService,
  ) {}

  @Get('events/:eventId/gates')
  findByEvent(
    @Param('eventId') eventId: string,
  ) {
    return this.gatesService.findByEvent(
      eventId,
    );
  }

  @Post('events/:eventId/gates')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateGateDto,
  ) {
    return this.gatesService.create(
      eventId,
      user,
      body,
    );
  }

  @Post('gates/:gateId/staff')
  @UseGuards(JwtAuthGuard)
  assignStaff(
    @Param('gateId') gateId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: AssignStaffDto,
  ) {
    return this.gatesService.assignStaff(
      gateId,
      user,
      body,
    );
  }

  @Delete(
    'gates/:gateId/staff/:userId',
  )
  @UseGuards(JwtAuthGuard)
  removeStaff(
    @Param('gateId') gateId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gatesService.removeStaff(
      gateId,
      userId,
      user,
    );
  }

  @Get('gates/mine')
  @UseGuards(JwtAuthGuard)
  findMine(
    @CurrentUser() user: AuthUser,
  ) {
    return this.gatesService.findMine(
      user.id,
    );
  }
}
