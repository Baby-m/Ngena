import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    TicketTypesModule,
    AuthModule,
    EventsModule,
    OrdersModule,
    TicketsModule,
  ],
})
export class AppModule {}
