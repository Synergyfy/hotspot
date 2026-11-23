import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(data: any) {
    const { email, password, name } = data;
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new BadRequestException('User already exists');

    const user = await this.usersService.create({ email, password, name });
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: await this.jwtService.signAsync(payload),
    };
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: await this.jwtService.signAsync(payload),
    };
  }

  async adminLogin(email: string, password: string) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    if (!adminEmail || !adminPassword) {
      throw new UnauthorizedException('Admin login is not configured');
    }
    if (email !== adminEmail || password !== adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    let user = await this.usersService.findByEmail(adminEmail);
    if (!user) {
      user = await this.usersService.create({ email: adminEmail, password: adminPassword, name: 'Super Admin' });
    }
    if (user.role !== 'admin') {
      user = await this.usersService.updateMcomFields(user.id, { role: 'admin' }) as any;
    }
    if (!user) throw new UnauthorizedException('Unable to provision admin user');

    const payload = { sub: user.id, email: user.email, role: 'admin' };
    return {
      user: { id: user.id, email: user.email, name: user.name || 'Super Admin', role: 'admin' },
      token: await this.jwtService.signAsync(payload),
    };
  }
}
