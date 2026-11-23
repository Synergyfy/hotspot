import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { McomService, McomIdentity, McomEntitlement } from './mcom.service';

const STATE_COOKIE = 'mcom_oauth_state';

interface AuthenticatedRequest extends Request {
  user?: { userId?: number | string; sub?: number | string };
}

@Controller('auth/sso')
export class SsoController {
  private readonly logger = new Logger(SsoController.name);

  constructor(
    private readonly mcomService: McomService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config')
  getConfig() {
    return {
      configured: this.mcomService.isConfigured(),
      membershipUrl: this.configService.get<string>('MCOM_MEMBERSHIP_URL'),
      walletEnabled:
        this.configService.get<string>('MCOM_WALLET_ENABLED') === 'true',
    };
  }

  @Get('health')
  health() {
    return this.mcomService.checkCentralHealth();
  }

  @Get('login')
  login(@Res() res: Response) {
    const frontendUrl = this.mcomService.frontendUrl;
    if (!this.mcomService.isConfigured()) {
      return res.redirect(`${frontendUrl}/login?error=not_configured`);
    }

    const state = crypto.randomBytes(32).toString('hex');
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600000,
      path: '/',
    });

    return res.redirect(
      this.mcomService.buildAuthorizeUrl(this.mcomService.redirectUri, state),
    );
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.completeSso(
        code,
        state,
        this.readCookie(req, STATE_COOKIE),
      );
      res.clearCookie(STATE_COOKIE, { path: '/' });
      return res.redirect(
        `${this.mcomService.frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}&role=${encodeURIComponent(result.user.role)}`,
      );
    } catch (error) {
      this.logger.error(`SSO callback failed: ${this.errorMessage(error)}`);
      const code = this.errorCode(error);
      const upgradeUrl = (error as ForbiddenException & { upgradeUrl?: string })
        .upgradeUrl;
      if (this.isUpgradeReason(code)) {
        return res.redirect(
          `${this.mcomService.frontendUrl}/upgrade?reason=${encodeURIComponent(code)}&upgradeUrl=${encodeURIComponent(upgradeUrl || '')}`,
        );
      }
      return res.redirect(
        `${this.mcomService.frontendUrl}/login?error=${encodeURIComponent(code)}`,
      );
    }
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Body() body: { code?: string; state?: string },
    @Req() req: Request,
  ) {
    try {
      return await this.completeSso(
        body?.code,
        body?.state,
        this.readCookie(req, STATE_COOKIE),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`SSO completion failed: ${this.errorMessage(error)}`);
      throw new BadRequestException('oauth_failed');
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(
    @Body() body: { userId?: number },
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.authenticatedUserId(req);
    const requested = Number(body?.userId);
    if (body?.userId !== undefined && requested !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    const tokens = await this.mcomService.getStoredTokens(userId);
    if (!tokens) {
      return { success: false, error: 'No tokens found' };
    }

    try {
      const refreshed = await this.mcomService.refreshTokens(
        tokens.refreshToken,
      );
      await this.mcomService.storeTokens(
        userId,
        refreshed.accessToken,
        refreshed.refreshToken,
        refreshed.expiresIn,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${this.errorMessage(error)}`);
      return { success: false, error: 'Failed to refresh tokens' };
    }
  }

  @Get('status/:userId')
  @UseGuards(JwtAuthGuard)
  async status(
    @Param('userId') userId: string,
    @Query('sync') sync?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const id = this.authenticatedUserId(req);
    if (Number(userId) !== id) throw new ForbiddenException('Forbidden');

    const status = await this.mcomService.getSsoStatus(id);
    if (sync !== 'true' || !status?.connected) {
      return status;
    }

    const tokens = await this.mcomService.getStoredTokens(id);
    if (!tokens) return status;

    try {
      const userInfo = await this.mcomService.fetchUserInfo(tokens.accessToken);
      const permissions = await this.mcomService.fetchPermissions(
        tokens.accessToken,
      );
      await this.mcomService.jitProvision(userInfo, permissions);
      return this.mcomService.getSsoStatus(id);
    } catch (error) {
      this.logger.error(`SSO status sync failed: ${this.errorMessage(error)}`);
      return status;
    }
  }

  @Get('data/permissions')
  @UseGuards(JwtAuthGuard)
  async permissions(
    @Query('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const id = this.authenticatedUserId(req);
    const requested = Number(userId);
    if (userId !== undefined && requested !== id) {
      throw new ForbiddenException('Forbidden');
    }

    const tokens = await this.mcomService.getStoredTokens(id);
    if (!tokens) return { error: 'No tokens found' };

    try {
      return await this.mcomService.fetchPermissions(tokens.accessToken);
    } catch (error) {
      this.logger.error(
        `Permissions fetch failed: ${this.errorMessage(error)}`,
      );
      return { error: 'Failed to fetch permissions' };
    }
  }

  private async completeSso(
    code?: string,
    state?: string,
    cookieState?: string,
  ) {
    if (!code) throw new BadRequestException('missing_code');
    if (!state || !cookieState || state !== cookieState) {
      throw new BadRequestException('invalid_state');
    }

    const tokenResponse = await this.mcomService.exchangeCode(code);
    let mcomUser: McomIdentity | undefined = tokenResponse.user;

    if (!mcomUser?.email) {
      mcomUser = await this.mcomService.fetchUserInfo(
        tokenResponse.accessToken,
      );
    }

    let entitlement: McomEntitlement | undefined = tokenResponse.entitlement;
    if (entitlement?.access?.hasAccess === undefined) {
      entitlement = await this.mcomService
        .fetchEntitlement(tokenResponse.accessToken)
        .catch(() => undefined);
    }

    let permissions = mcomUser?.permissions || null;
    if (!permissions) {
      permissions = await this.mcomService
        .fetchPermissions(tokenResponse.accessToken)
        .catch(() => null);
    }

    if (entitlement?.access?.hasAccess !== true) {
      const denial = new ForbiddenException(
        entitlement?.access?.reason || 'access_denied',
      );
      (denial as ForbiddenException & { upgradeUrl?: string }).upgradeUrl =
        entitlement?.access?.upgradeUrl;
      throw denial;
    }

    if (entitlement?.whitelabel?.enabled) {
      const identity = mcomUser as unknown as
        Record<string, unknown> | undefined;
      const profileTypeValue = identity?.profileType ?? identity?.role;
      const profileType =
        typeof profileTypeValue === 'string' ? profileTypeValue : undefined;
      const isBusiness = profileType === 'BUSINESS';
      const granted =
        isBusiness &&
        entitlement.access?.accessType === 'WHITELABEL' &&
        entitlement.whitelabel.granted === true &&
        entitlement.whitelabel.roleEligible !== false;
      if (!granted) {
        throw new ForbiddenException(
          isBusiness ? 'WHITELABEL_ACCESS_DENIED' : 'WHITELABEL_BUSINESS_ONLY',
        );
      }
    }

    const user = await this.mcomService.jitProvision(mcomUser, permissions);
    await this.mcomService.storeTokens(
      user.id,
      tokenResponse.accessToken,
      tokenResponse.refreshToken,
      tokenResponse.expiresIn,
    );
    const token = await this.mcomService.issueLocalJwt({
      email: user.email,
      id: user.id,
      role: user.role,
      isOnboarded: user.isOnboarded,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isOnboarded: user.isOnboarded,
      },
    };
  }

  private authenticatedUserId(req?: AuthenticatedRequest): number {
    const raw = req?.user?.userId ?? req?.user?.sub;
    const id = Number(raw);
    if (raw === undefined || raw === null || !Number.isFinite(id)) {
      throw new ForbiddenException('Forbidden');
    }
    return id;
  }

  private readCookie(req: Request, name: string): string | undefined {
    const cookie = req?.headers?.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    return cookie
      ? decodeURIComponent(cookie.slice(name.length + 1))
      : undefined;
  }

  private isUpgradeReason(code: string): boolean {
    return [
      'SUBSCRIPTION_REQUIRED',
      'NO_ACTIVE_PLAN',
      'PLAN_REQUIRED',
      'TRIAL_EXPIRED',
      'PAYMENT_FAILED',
    ].includes(code);
  }

  private errorCode(error: unknown): string {
    if (error instanceof BadRequestException) return String(error.message);
    if (error instanceof ForbiddenException) {
      const reason = String(error.message);
      return /^[A-Z_]+$/.test(reason) ? reason : 'access_denied';
    }
    return 'oauth_failed';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
