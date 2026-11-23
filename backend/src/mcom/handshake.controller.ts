import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { McomService, McomIdentity } from './mcom.service';

interface HandshakePayload {
  sub?: string;
  mcomUserId?: string;
  email?: string;
  name?: string;
  role?: string;
  membershipLevel?: string;
  membershipTier?: string;
  membershipStatus?: string;
  permissions?: Record<string, boolean>;
}

@Controller('auth')
export class HandshakeController {
  private readonly logger = new Logger(HandshakeController.name);

  constructor(
    private readonly mcomService: McomService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('sso-login')
  async ssoLogin(@Query('token') token: string, @Res() res: Response) {
    try {
      const result = await this.authenticate(token);
      return res.redirect(
        `${this.mcomService.frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}&role=${encodeURIComponent(result.user.role)}`,
      );
    } catch (error) {
      this.logger.error(
        `SSO handshake failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return res.redirect(
        `${this.mcomService.frontendUrl}/login?error=invalid_token`,
      );
    }
  }

  @Post('sso/complete-handshake')
  @HttpCode(HttpStatus.OK)
  async completeHandshake(@Body() body: { token?: string }) {
    return this.authenticate(body?.token);
  }

  private async authenticate(token?: string) {
    if (!token) throw new BadRequestException('missing_token');

    const secret = this.configService.get<string>('SSO_SECRET');
    if (!secret) throw new UnauthorizedException('SSO_SECRET not configured');

    const payload = await this.jwtService.verifyAsync<HandshakePayload>(token, {
      secret,
      issuer: 'mcom-central',
    });

    const mcomUser: McomIdentity = {
      id: payload.sub || payload.mcomUserId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      membershipLevel: payload.membershipLevel,
      membershipTier: payload.membershipTier,
      membershipStatus: payload.membershipStatus,
      permissions: payload.permissions,
    };

    const user = await this.mcomService.jitProvision(mcomUser);
    const localToken = await this.mcomService.issueLocalJwt({
      email: user.email,
      id: user.id,
      role: user.role,
      isOnboarded: user.isOnboarded,
    });

    return {
      token: localToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isOnboarded: user.isOnboarded,
      },
    };
  }
}
