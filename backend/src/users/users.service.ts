import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  async updateMcomFields(
    userId: number,
    mcomData: Partial<{
      mcomUserId: string;
      mcomMembershipLevel: string;
      mcomMembershipTier: string;
      mcomMembershipStatus: string;
      mcomCanAccessVcard: boolean;
      mcomAccessToken: string;
      mcomRefreshToken: string;
      mcomTokenExpiresAt: Date;
      mcomTokensUpdatedAt: Date;
    }>,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: mcomData,
    });
  }

  async create(data: {
    email: string;
    password?: string | null;
    name?: string;
    role?: string;
    mcomUserId?: string;
    mcomMembershipLevel?: string;
    mcomMembershipTier?: string;
    mcomMembershipStatus?: string;
    mcomCanAccessVcard?: boolean;
  }) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }
}
