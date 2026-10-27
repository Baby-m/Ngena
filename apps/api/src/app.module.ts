import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';
import { CheckInsModule } from './modules/checkins/checkins.module.js';
import { GatesModule } from './modules/gates/gates.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AvailabilityModule } from './modules/availability/availability.module.js';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    GatesModule,
    CheckInsModule,
    TicketTypesModule,
    AuthModule,
    EventsModule,
    OrdersModule,
    TicketsModule,
    DashboardModule,
    PaymentsModule,
    AvailabilityModule,
  ],
})
export class AppModule {}