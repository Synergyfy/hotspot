import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private users: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.users.findOne({ where: { email } });
  }

  async findById(id: number) {
    return this.users.findOne({ where: { id } });
  }

  async findByMcomUserId(mcomUserId: string) {
    return this.users.findOne({ where: { mcomUserId } });
  }

  async updateMcomFields(userId: number, mcomData: Partial<{
    mcomUserId: string;
    mcomMembershipLevel: string;
    mcomMembershipTier: string;
    mcomMembershipStatus: string;
    mcomCanAccessVcard: boolean;
    mcomAccessToken: string;
    mcomRefreshToken: string;
    mcomTokenExpiresAt: Date;
    mcomTokensUpdatedAt: Date;
  }>) {
    await this.users.update(userId, mcomData);
    return this.findById(userId);
  }

  async create(data: { email: string; password?: string; name?: string; role?: string }) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
    const user = this.users.create({
      ...data,
      password: hashedPassword,
    });
    return this.users.save(user);
  }
}
