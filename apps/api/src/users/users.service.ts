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

  async create(data: { email: string; password: string; name?: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.users.create({
      ...data,
      password: hashedPassword,
    });
    return this.users.save(user);
  }
}
