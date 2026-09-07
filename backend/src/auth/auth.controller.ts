import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottleGuard } from '../common/guards/throttle.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(new ThrottleGuard(5, 15 * 60 * 1000)) // 5 per 15 minutes
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new ThrottleGuard(10, 15 * 1000)) // 10 per 15 seconds
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }
}
