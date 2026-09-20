import { UserRole } from '../../../../generated/prisma/client.js';

export class CreateUserDto {
  name!: string;
  email!: string;
  password!: string;
  role?: UserRole;
}
