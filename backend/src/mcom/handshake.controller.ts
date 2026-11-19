import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { McomService } from './mcom.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class HandshakeController {
  private readonly logger = new Logger(HandshakeController.name);

  constructor(
    private mcomService: McomService,
    private configService: ConfigService,
  ) {}

  /**
   * Central-hub handshake: MCOM redirects here with a short-lived JWT.
   * We verify it, JIT-provision the user and issue our own local JWT.
   */
  @Get('sso-login')
  async ssoLogin(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    try {
      if (!token) {
        return res.redirect(`${frontendUrl}/login?error=missing_token`);
      }

      const ssoSecret = this.configService.get<string>('SSO_SECRET');
      if (!ssoSecret) {
        this.logger.error('SSO_SECRET not configured');
        return res.redirect(`${frontendUrl}/login?error=server_error`);
      }

      const payload = jwt.verify(token, ssoSecret, {
        issuer: 'mcom-central',
      }) as {
        sub: string;
        email?: string;
        name?: string;
        role?: string;
        membershipLevel?: string;
        membershipTier?: string;
        membershipStatus?: string;
      };

      const mcomUser = {
        id: payload.sub || '',
        email: payload.email,
        name: payload.name,
        role: payload.role,
        membershipLevel: payload.membershipLevel,
        membershipTier: payload.membershipTier,
        membershipStatus: payload.membershipStatus,
      };

      const user = await this.mcomService.jitProvision(mcomUser);

      const localJwt = await this.mcomService.issueLocalJwt({
        email: user.email,
        id: user.id,
        role: user.role,
        isOnboarded: user.isOnboarded,
      });

      return res.redirect(`${frontendUrl}/auth/callback?token=${localJwt}&role=${user.role}`);
    } catch (error) {
      this.logger.error('Handshake verification error:', error);
      return res.redirect(`${frontendUrl}/login?error=invalid_token`);
    }
  }
}
