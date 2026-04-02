import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const { email, password, name } = data;
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new BadRequestException('User already exists');

    const user = await this.usersService.create({ email, password, name });
    const payload = { sub: user.id, email: user.email };
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: await this.jwtService.signAsync(payload),
    };
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: await this.jwtService.signAsync(payload),
    };
  }
}
