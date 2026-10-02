import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  CreateUserDto,
} from './dto/create-user.dto.js';

import {
  UpdateUserRoleDto,
} from './dto/update-user-role.dto.js';

import {
  UsersService,
} from './users.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  findAll() {
    return this.usersService
      .findAll();
  }

  /*
   * Esta rota deve ficar antes
   * de @Get(':id').
   */
  @Get('gate-staff-candidates')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.ORGANIZER,
    UserRole.SUPER_ADMIN,
  )
  findGateStaffCandidates() {
    return this.usersService
      .findGateStaffCandidates();
  }

  @Patch(':id/role')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  updateRole(
    @Param('id')
    id: string,

    @Body()
    body: UpdateUserRoleDto,

    @CurrentUser()
    currentUser: AuthUser,
  ) {
    return this.usersService
      .updateRole(
        id,
        body,
        currentUser.id,
      );
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.usersService
      .findById(id);
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  create(
    @Body()
    body: CreateUserDto,
  ) {
    return this.usersService
      .create(body);
  }
}
