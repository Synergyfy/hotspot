import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

type SsoUserData = Record<string, unknown> & {
  email: string;
  name?: string;
  role?: string;
  password?: string;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByMcomUserId(mcomUserId: string) {
    return this.prisma.user.findUnique({ where: { mcomUserId } });
  }

  async create(data: { email: string; password: string; name?: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async createSsoUser(data: SsoUserData) {
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(
      password ?? randomBytes(32).toString('hex'),
      10,
    );
    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      } as Prisma.UserCreateInput,
    });
  }

  async updateMcomFields(id: number, fields: Record<string, unknown>) {
    return this.prisma.user.update({
      where: { id },
      data: fields as Prisma.UserUpdateInput,
    });
  }
}
