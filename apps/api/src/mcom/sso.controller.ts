import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Req,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { McomService } from './mcom.service';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('auth/sso')
export class SsoController {
  private readonly logger = new Logger(SsoController.name);

  constructor(
    private mcomService: McomService,
    private configService: ConfigService,
  ) {}

  @Get('config')
  @Public()
  getConfig() {
    return {
      membershipUrl: this.configService.get<string>('MCOM_MEMBERSHIP_URL'),
      walletEnabled: this.configService.get<string>('MCOM_WALLET_ENABLED') === 'true',
      configured: !!this.configService.get<string>('MCOM_CLIENT_ID'),
    };
  }

  @Get('login')
  @Public()
  async login(@Res() res: Response) {
    const state = crypto.randomBytes(32).toString('hex');
    const redirectUri = this.configService.get<string>('MCOM_REDIRECT_URI') || 'http://localhost:3000/auth/callback';

    res.cookie('mcom_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600000, // 10 minutes
    });

    const authorizeUrl = this.mcomService.buildAuthorizeUrl(redirectUri, state);
    res.redirect(authorizeUrl);
  }

  @Get('callback')
  @Public()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    try {
      // Verify state
      const cookieState = (req as any)?.cookies?.mcom_oauth_state;
      if (!cookieState || cookieState !== state) {
        return res.redirect(`${frontendUrl}/login?error=invalid_state`);
      }

      if (!code) {
        return res.redirect(`${frontendUrl}/login?error=missing_code`);
      }

      // Exchange code for tokens
      const tokenResponse = await this.mcomService.exchangeCode(code);
      const { access_token, refresh_token, expires_in, user: mcomUser } = tokenResponse;
      const permissions = mcomUser?.permissions;

      // Check permissions
      const platformSlug = this.configService.get<string>('MCOM_PLATFORM_SLUG');
      if (permissions && !permissions[`canAccess_${platformSlug}`]) {
        return res.redirect(`${frontendUrl}/login?error=access_denied`);
      }

      // JIT provision user (guaranteed to return user)
      const user = (await this.mcomService.jitProvision(mcomUser, permissions)) as any;

      // Store tokens
      await this.mcomService.storeTokens(user.id, access_token, refresh_token, expires_in);

      // Issue local JWT
      const jwt = await this.mcomService.issueLocalJwt({
        email: user.email,
        id: user.id,
        role: user.role,
        isOnboarded: user.isOnboarded,
      });

      // Clear the state cookie
      res.clearCookie('mcom_oauth_state');

      // Redirect to frontend callback
      return res.redirect(`${frontendUrl}/auth/callback?token=${jwt}&role=${user.role}`);
    } catch (error) {
      this.logger.error('SSO callback error:', error);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { userId: number }) {
    const tokens = await this.mcomService.getStoredTokens(body.userId);
    if (!tokens) {
      return { success: false, error: 'No tokens found' };
    }

    try {
      const refreshedTokens = await this.mcomService.refreshTokens(tokens.refreshToken);
      await this.mcomService.storeTokens(
        body.userId,
        refreshedTokens.access_token,
        refreshedTokens.refresh_token,
        refreshedTokens.expires_in,
      );
      return { success: true };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      return { success: false, error: 'Failed to refresh tokens' };
    }
  }

  @Get('status/:userId')
  @Public()
  async getStatus(@Param('userId') userId: number, @Query('sync') sync?: string) {
    const status = await this.mcomService.getSsoStatus(userId);

    if (sync === 'true' && status?.connected) {
      const tokens = await this.mcomService.getStoredTokens(userId);
      if (tokens) {
        try {
          const userInfo = await this.mcomService.fetchUserInfo(tokens.accessToken);
          const permissions = await this.mcomService.fetchPermissions(tokens.accessToken);
          const platformSlug = this.configService.get<string>('MCOM_PLATFORM_SLUG');

          await this.mcomService.jitProvision(userInfo, permissions);
          return await this.mcomService.getSsoStatus(userId);
        } catch (error) {
          this.logger.error('Status sync error:', error);
        }
      }
    }

    return status;
  }

  @Get('data/permissions')
  @Public()
  async getPermissions(@Query('userId') userId: number) {
    const tokens = await this.mcomService.getStoredTokens(userId);
    if (!tokens) {
      return { error: 'No tokens found' };
    }

    try {
      return await this.mcomService.fetchPermissions(tokens.accessToken);
    } catch (error) {
      this.logger.error('Permissions fetch error:', error);
      return { error: 'Failed to fetch permissions' };
    }
  }
}