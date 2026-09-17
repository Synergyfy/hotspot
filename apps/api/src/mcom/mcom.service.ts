import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class McomService {
  private readonly logger = new Logger(McomService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private httpService: HttpService,
    private usersService: UsersService,
  ) {}

  buildAuthorizeUrl(redirectUri: string, state: string): string {
    const baseUrl = this.configService.get<string>('MCOM_SOLUTIONS_URL');
    const clientId = this.configService.get<string>('MCOM_CLIENT_ID');
    const scopes = this.configService.get<string>('MCOM_SCOPES', 'profile email business membership packages');

    return `${baseUrl}/api/v1/auth/sso/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  }

  async exchangeCode(code: string) {
    const baseUrl = this.configService.get<string>('MCOM_SOLUTIONS_URL');
    const clientId = this.configService.get<string>('MCOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MCOM_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('MCOM_REDIRECT_URI');

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.httpService.post(
        `${baseUrl}/api/v1/auth/sso/token`,
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        membershipLevel: string;
        membershipStatus: string;
        permissions: Record<string, boolean>;
      };
    };
  }

  async refreshTokens(refreshToken: string) {
    const baseUrl = this.configService.get<string>('MCOM_SOLUTIONS_URL');
    const clientId = this.configService.get<string>('MCOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MCOM_CLIENT_SECRET');

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.httpService.post(
        `${baseUrl}/api/v1/auth/sso/token/refresh`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        membershipLevel: string;
        membershipStatus: string;
        permissions: Record<string, boolean>;
      };
    };
  }

  async fetchUserInfo(accessToken: string) {
    const baseUrl = this.configService.get<string>('MCOM_SOLUTIONS_URL');

    const response = await firstValueFrom(
      this.httpService.get(`${baseUrl}/api/v1/auth/sso/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );

    return response.data as {
      id: string;
      email: string;
      name: string;
    };
  }

  async fetchPermissions(accessToken: string) {
    const baseUrl = this.configService.get<string>('MCOM_SOLUTIONS_URL');
    const hmacSecret = this.configService.get<string>('MCOM_HMAC_SECRET');

    if (!hmacSecret) {
      throw new Error('MCOM_HMAC_SECRET not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/api/v1/data/permissions';
    const body = '';

    const signaturePayload = `${method}${path}${timestamp}${body}`;
    const hmac = crypto.createHmac('sha256', hmacSecret).update(signaturePayload).digest('hex');

    const response = await firstValueFrom(
      this.httpService.get(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Timestamp': timestamp,
          'X-Signature': hmac,
        },
      }),
    );

    return response.data as {
      [key: string]: boolean;
    };
  }

  async jitProvision(mcomUser: any, permissions: any = null) {
    const platformSlug = this.configService.get<string>('MCOM_PLATFORM_SLUG');

    let user = await this.usersService.findByMcomUserId(mcomUser.id);

    if (!user) {
      user = await this.usersService.findByEmail(mcomUser.email);
    }

    const mcomFields: Partial<{
      mcomUserId: string;
      mcomMembershipLevel: string;
      mcomMembershipTier: string;
      mcomMembershipStatus: string;
      mcomCanAccessVcard: boolean;
    }> = {
      mcomUserId: mcomUser.id,
      mcomMembershipLevel: mcomUser.membershipLevel,
      mcomMembershipTier: mcomUser.membershipTier,
      mcomMembershipStatus: mcomUser.membershipStatus,
      mcomCanAccessVcard: permissions ? permissions[`canAccess_${platformSlug}`] === true : false,
    };

    if (user) {
      await this.usersService.updateMcomFields(user.id, mcomFields as any);
      user = await this.usersService.findById(user.id);
    } else {
      user = await this.usersService.create({
        email: mcomUser.email,
        name: mcomUser.name,
        role: mcomUser.role || 'agent',
        ...mcomFields,
      });
    }

    return user;
  }

  encryptToken(token: string): string {
    const encryptionKey = this.configService.get<string>('JWT_SECRET');
    if (!encryptionKey) {
      throw new Error('JWT_SECRET not configured');
    }
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decryptToken(encryptedToken: string): string {
    const encryptionKey = this.configService.get<string>('JWT_SECRET');
    if (!encryptionKey) {
      throw new Error('JWT_SECRET not configured');
    }
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);

    const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async storeTokens(userId: number, accessToken: string, refreshToken: string, expiresIn: number) {
    const encryptedAccessToken = this.encryptToken(accessToken);
    const encryptedRefreshToken = this.encryptToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    await this.usersService.updateMcomFields(userId, {
      mcomAccessToken: encryptedAccessToken,
      mcomRefreshToken: encryptedRefreshToken,
      mcomTokenExpiresAt: expiresAt,
      mcomTokensUpdatedAt: new Date(),
    });
  }

  async issueLocalJwt(user: { email: string; id: number; role: string; isOnboarded: boolean }): Promise<string> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      isOnboarded: user.isOnboarded,
    };

    return this.jwtService.signAsync(payload);
  }

  async getStoredTokens(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mcomAccessToken || !user.mcomRefreshToken) {
      return null;
    }

    return {
      accessToken: this.decryptToken(user.mcomAccessToken),
      refreshToken: this.decryptToken(user.mcomRefreshToken),
      expiresAt: user.mcomTokenExpiresAt,
    };
  }

  async getSsoStatus(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }

    return {
      connected: !!user.mcomUserId,
      membershipLevel: user.mcomMembershipLevel,
      membershipTier: user.mcomMembershipTier,
      membershipStatus: user.mcomMembershipStatus,
      canAccessVcard: user.mcomCanAccessVcard,
      tokenExpiresAt: user.mcomTokenExpiresAt,
      tokensUpdatedAt: user.mcomTokensUpdatedAt,
    };
  }
}