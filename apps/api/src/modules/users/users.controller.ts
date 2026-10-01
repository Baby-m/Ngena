import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../../../generated/prisma/client.js';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

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
    return this.usersService.findAll();
  }

  /**
   * Utilizado pelo Organizer para encontrar
   * utilizadores que podem ser atribuídos
   * aos gates.
   *
   * IMPORTANTE:
   * esta rota deve aparecer antes de @Get(':id').
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

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  findOne(
    @Param('id') id: string,
  ) {
    return this.usersService.findById(
      id,
    );
  }

  /**
   * Criação administrativa.
   *
   * Registo normal continua em:
   * POST /auth/register
   */
  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  create(
    @Body() body: CreateUserDto,
  ) {
    return this.usersService.create(
      body,
    );
  }
}
