import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [PrismaModule, UsersModule],
})
export class AppModule {}