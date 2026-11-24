import {
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
import { InvitesService } from './invites.service.js';

type AuthUser = {
  id: string;
  role: UserRole;
};

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  // Público: quem recebe o link vê o evento antes de criar conta.
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.invitesService.preview(token);
  }

  // Só contas de cliente aceitam convites.
  @Post(':token/claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  claim(
    @Param('token') token: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invitesService.claim(token, user);
  }
}
