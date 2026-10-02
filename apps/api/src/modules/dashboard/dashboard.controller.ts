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
  DashboardService,
} from './dashboard.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('dashboard')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class DashboardController {
  constructor(
    private readonly dashboardService:
      DashboardService,
  ) {}

  @Get('organizer')
  @Roles(
    UserRole.ORGANIZER,
    UserRole.SUPER_ADMIN,
  )
  getOrganizerOverview(
    @CurrentUser()
    user: AuthUser,
  ) {
    return this.dashboardService
      .getOrganizerOverview(
        user,
      );
  }

  @Get('admin/events')
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  getAdminEvents() {
    return this.dashboardService
      .getAdminEvents();
  }

  @Get('events/:eventId')
  @Roles(
    UserRole.ORGANIZER,
    UserRole.SUPER_ADMIN,
  )
  getEventStats(
    @Param('eventId')
    eventId: string,

    @CurrentUser()
    user: AuthUser,
  ) {
    return this.dashboardService
      .getEventStats(
        eventId,
        user,
      );
  }
}
