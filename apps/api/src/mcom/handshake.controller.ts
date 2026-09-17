import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { McomService } from './mcom.service';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class HandshakeController {
  private readonly logger = new Logger(HandshakeController.name);

  constructor(
    private mcomService: McomService,
    private configService: ConfigService,
  ) {}

  @Get('sso-login')
  @Public()
  async ssoLogin(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    try {
      if (!token) {
        return res.redirect(`${frontendUrl}/login?error=missing_token`);
      }

      const ssoSecret = this.configService.get<string>('SSO_SECRET');
      if (!ssoSecret) {
        this.logger.error('SSO_SECRET not configured');
        return res.redirect(`${frontendUrl}/login?error=server_error`);
      }

      // Verify the JWT from MCOM Central Hub
      const payload = jwt.verify(token, ssoSecret, {
        issuer: 'mcom-central',
      }) as { sub: string; email?: string; name?: string; role?: string; membershipLevel?: string; membershipTier?: string; membershipStatus?: string };

      // Extract user info from JWT payload
      const mcomUser = {
        id: payload.sub || '',
        email: payload.email,
        name: payload.name,
        role: payload.role,
        membershipLevel: payload.membershipLevel,
        membershipTier: payload.membershipTier,
        membershipStatus: payload.membershipStatus,
      };

      // JIT provision user (guaranteed to return user)
      const user = (await this.mcomService.jitProvision(mcomUser)) as any;

      // Issue local JWT
      const localJwt = await this.mcomService.issueLocalJwt({
        email: user.email,
        id: user.id,
        role: user.role,
        isOnboarded: user.isOnboarded,
      });

      // Redirect to frontend callback
      return res.redirect(`${frontendUrl}/auth/callback?token=${localJwt}&role=${user.role}`);
    } catch (error) {
      this.logger.error('Handshake verification error:', error);
      return res.redirect(`${frontendUrl}/login?error=invalid_token`);
    }
  }
}