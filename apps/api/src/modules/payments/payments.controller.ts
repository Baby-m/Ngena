import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';

type AuthUser = {
  id: string;
};

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  pay(@CurrentUser() user: AuthUser, @Body() body: CreatePaymentDto) {
    return this.paymentsService.pay(user.id, body);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.paymentsService.findMine(user.id);
  }
}
