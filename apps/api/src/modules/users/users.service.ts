import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';

import {
  UserRole,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateUserDto) {
    const email = data.email
      .toLowerCase()
      .trim();

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'Email already in use',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        data.password,
        12,
      );

    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: passwordHash,
        role:
          data.role ??
          UserRole.CUSTOMER,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  findGateStaffCandidates() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [
            UserRole.GATE_STAFF,
            UserRole.GATE_MANAGER,
          ],
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
}
