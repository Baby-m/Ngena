import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrdersService } from './orders.service.js';

type AuthUser = { id: string };

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // A compra agora passa por POST /payments. Criar encomendas diretamente
  // daria bilhetes gratis, por isso a rota POST /orders foi removida.

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user.id);
  }
}
