import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    EventsModule,
  ],
})
export class AppModule {}
