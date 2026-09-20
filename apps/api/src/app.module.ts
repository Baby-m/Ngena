import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [DatabaseModule, UsersModule],
})
export class AppModule {}
