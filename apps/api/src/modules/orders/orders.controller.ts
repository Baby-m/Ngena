import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';

type AuthUser = {
  id: string;
};

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService:
      OrdersService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.create(
      user.id,
      body,
    );
  }

  @Get('mine')
  findMine(
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findMine(
      user.id,
    );
  }
}
