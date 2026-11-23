import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

export interface McomIdentity {
  id?: string;
  sub?: string;
  mcomUserId?: string;
  email?: string;
  name?: string;
  role?: string;
  membershipLevel?: string;
  membershipTier?: string;
  membershipStatus?: string;
  permissions?: Record<string, boolean>;
  businessProfile?: any;
  profile?: Record<string, any>;
  business?: Record<string, any>;
  isAffiliate?: boolean;
  [key: string]: any;
}

export interface McomEntitlement {
  access?: {
    hasAccess?: boolean;
    reason?: string;
    accessType?: string;
    upgradeUrl?: string;
  };
  whitelabel?: {
    enabled?: boolean;
    granted?: boolean;
    roleEligible?: boolean;
    grantedAt?: string;
  };
  plan?: {
    planId?: string;
    planName?: string;
    quotas?: Record<string, unknown>;
  };
  trialContext?: {
    programmeTasks?: unknown[];
  };
}

interface McomTokenResponse {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  expires_in?: number;
  expiresIn?: number;
  user?: McomIdentity;
  entitlement?: McomEntitlement;
}

export interface SsoCompletion {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: McomIdentity;
  entitlement?: McomEntitlement;
}

@Injectable()
export class McomService {
  private readonly logger = new Logger(McomService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  get frontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    );
  }

  get redirectUri(): string {
    return (
      this.configService.get<string>('MCOM_REDIRECT_URI') ||
      `${this.frontendUrl}/auth/callback`
    );
  }

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('MCOM_CLIENT_ID') &&
      this.configService.get<string>('MCOM_CLIENT_SECRET') &&
      this.configService.get<string>('MCOM_SOLUTIONS_URL'),
    );
  }

  buildAuthorizeUrl(redirectUri: string, state: string): string {
    const clientId = this.configService.get<string>('MCOM_CLIENT_ID');
    const scopes = this.configService.get<string>(
      'MCOM_SCOPES',
      'profile email business',
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId || '',
      redirect_uri: redirectUri,
      state,
      scope: scopes,
    });

    return `${this.baseUrl()}/api/v1/auth/sso/authorize?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string = this.redirectUri,
  ): Promise<SsoCompletion> {
    const response = await this.post<McomTokenResponse>(
      '/api/v1/auth/sso/token',
      {
        grant_type: 'authorization_code',
        client_id: this.configService.get<string>('MCOM_CLIENT_ID'),
        code,
        redirect_uri: redirectUri,
      },
      { Authorization: `Basic ${this.basicAuth()}` },
    );
    return this.normalizeCompletion(response);
  }

  async refreshTokens(refreshToken: string): Promise<SsoCompletion> {
    const response = await this.post<McomTokenResponse>(
      '/api/v1/auth/sso/token/refresh',
      {
        grant_type: 'refresh_token',
        client_id: this.configService.get<string>('MCOM_CLIENT_ID'),
        refresh_token: refreshToken,
      },
      { Authorization: `Basic ${this.basicAuth()}` },
    );
    return this.normalizeCompletion(response);
  }

  async checkCentralHealth(): Promise<{
    reachable: boolean;
    status?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl()}/api/v1/ecosystem/discovery`,
        { signal: AbortSignal.timeout(3000) },
      );
      return { reachable: response.ok, status: response.status };
    } catch (error) {
      return {
        reachable: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async fetchEntitlement(accessToken: string): Promise<McomEntitlement> {
    return this.get<McomEntitlement>(
      '/api/v1/auth/sso/entitlement',
      accessToken,
    );
  }

  async fetchEntitlementByUserId(
    userId: string | number,
  ): Promise<McomEntitlement> {
    const apiKey = this.configService.get<string>('MCOM_API_KEY');
    const clientId = this.configService.get<string>('MCOM_CLIENT_ID');
    if (!apiKey || !clientId) {
      throw new Error('MCOM API key or client id not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      user_id: String(userId),
    });
    const response = await fetch(
      `${this.baseUrl()}/api/v1/auth/sso/entitlement?${params.toString()}`,
      { headers: { 'X-API-Key': apiKey } },
    );
    if (!response.ok) {
      throw new Error(`Entitlement introspection failed (${response.status})`);
    }
    return (await response.json()) as McomEntitlement;
  }

  async fetchUserInfo(accessToken: string): Promise<McomIdentity> {
    return this.get<McomIdentity>('/api/v1/auth/sso/userinfo', accessToken);
  }

  async fetchPermissions(
    accessToken: string,
  ): Promise<Record<string, boolean>> {
    const hmacSecret = this.configService.get<string>('MCOM_HMAC_SECRET');
    if (!hmacSecret) {
      throw new Error('MCOM_HMAC_SECRET not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = '/api/v1/data/permissions';
    const signature = crypto
      .createHmac('sha256', hmacSecret)
      .update(`GET${path}${timestamp}`)
      .digest('hex');

    return this.get<Record<string, boolean>>(path, accessToken, {
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    });
  }

  async jitProvision(
    mcomUser: McomIdentity,
    permissions: Record<string, boolean> | null = null,
  ) {
    const mcomUserId = mcomUser?.id || mcomUser?.sub || mcomUser?.mcomUserId;
    const email = mcomUser?.email;
    if (!email) {
      throw new Error('MCOM identity is missing an email address');
    }

    let user = mcomUserId
      ? await this.usersService.findByMcomUserId(String(mcomUserId))
      : null;
    if (!user) {
      user = await this.usersService.findByEmail(email);
    }

    const identity = mcomUser as unknown as Record<string, unknown>;
    const businessProfile = (identity.businessProfile || {}) as Record<
      string,
      unknown
    >;
    const profileTypeValue = identity.profileType ?? identity.role;
    const profileType =
      typeof profileTypeValue === 'string' ? profileTypeValue : undefined;
    const profiles: Record<string, unknown> = {
      BUSINESS: identity.businessProfile,
      CUSTOMER: identity.customerProfile,
      AGENT: identity.agentProfile,
      CONSULTANT: identity.consultantProfile,
      ACCOUNT_MANAGER: identity.accountManagerProfile,
    };
    const roleProfile = (profiles[profileType || ''] || {}) as Record<
      string,
      unknown
    >;

    const platformSlug = this.configService.get<string>('MCOM_PLATFORM_SLUG');
    const fields: Record<string, unknown> = {};
    const set = (key: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== '') {
        fields[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    };
    const asText = (value: unknown): string | undefined =>
      typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : undefined;

    set('mcomUserId', mcomUserId);
    set('firstName', identity.firstName);
    set('lastName', identity.lastName);
    const fullName = asText(identity.fullName);
    if (!fields.firstName && fullName) {
      const [first, ...rest] = fullName.trim().split(/\s+/);
      fields.firstName = first;
      if (rest.length > 0) fields.lastName = rest.join(' ');
    }
    set('jobTitle', identity.jobTitle);
    set('phone', identity.phone ?? roleProfile.phone);
    set('address', identity.address);
    set('postcode', identity.postcode);
    set('country', identity.country);
    set('companyName', identity.businessName ?? businessProfile.businessName);
    set('companyType', businessProfile.businessType);
    set('companyIndustry', businessProfile.industry);
    set('companyWebsite', businessProfile.website);
    set(
      'companyLogo',
      identity.avatarUrl ?? businessProfile.logoUrl ?? identity.companyLogo,
    );
    set(
      'mcomMembershipLevel',
      identity.membershipLevel ?? businessProfile.membershipLevel,
    );
    set(
      'mcomMembershipTier',
      identity.membershipTier ?? businessProfile.membershipTier,
    );
    set(
      'mcomMembershipStatus',
      identity.membershipStatus ?? businessProfile.membershipStatus,
    );
    if (permissions && platformSlug) {
      fields.mcomCanAccessVcard =
        permissions[`canAccess_${platformSlug}`] === true;
    }
    if (identity.businessProfile !== undefined) {
      fields.mcomBusinessProfile = identity.businessProfile;
    }
    if (identity.isAffiliate !== undefined) {
      fields.isAffiliate = Boolean(identity.isAffiliate);
    }

    if (user) {
      await this.usersService.updateMcomFields(user.id, fields);
      const updated = await this.usersService.findById(user.id);
      if (!updated) throw new Error('Failed to load the provisioned user');
      return updated;
    }

    const displayName =
      asText(identity.name) ??
      asText(identity.fullName) ??
      asText(fields.firstName) ??
      email;
    const role =
      profileType ??
      (typeof identity.role === 'string' ? identity.role : 'agent');

    return this.usersService.createSsoUser({
      email,
      name: displayName,
      role,
      ...fields,
    });
  }

  async storeTokens(
    userId: number,
    accessToken?: string,
    refreshToken?: string,
    expiresIn?: number,
  ) {
    const data: Record<string, any> = { mcomTokensUpdatedAt: new Date() };
    if (accessToken) data.mcomAccessToken = this.encryptToken(accessToken);
    if (refreshToken) data.mcomRefreshToken = this.encryptToken(refreshToken);
    if (expiresIn)
      data.mcomTokenExpiresAt = new Date(Date.now() + Number(expiresIn) * 1000);
    await this.usersService.updateMcomFields(userId, data);
  }

  async getStoredTokens(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user?.mcomAccessToken || !user.mcomRefreshToken) {
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
      connected: Boolean(user.mcomUserId),
      membershipLevel: user.mcomMembershipLevel,
      membershipTier: user.mcomMembershipTier,
      membershipStatus: user.mcomMembershipStatus,
      canAccessVcard: user.mcomCanAccessVcard,
      tokenExpiresAt: user.mcomTokenExpiresAt,
      tokensUpdatedAt: user.mcomTokensUpdatedAt,
    };
  }

  async issueLocalJwt(user: {
    email: string;
    id: number;
    role: string;
    isOnboarded: boolean;
  }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
    });
  }

  private normalizeCompletion(response: McomTokenResponse): SsoCompletion {
    const accessToken = response.access_token || response.accessToken;
    if (!accessToken) {
      throw new Error('MCOM token response is missing an access token');
    }

    return {
      accessToken,
      refreshToken: response.refresh_token || response.refreshToken,
      expiresIn: response.expires_in ?? response.expiresIn,
      user: response.user || {},
      entitlement: response.entitlement,
    };
  }

  private baseUrl(): string {
    const baseUrl = this.configService.get<string>('MCOM_SOLUTIONS_URL');
    if (!baseUrl) {
      throw new Error('MCOM_SOLUTIONS_URL not configured');
    }
    return baseUrl.replace(/\/+$/, '');
  }

  private basicAuth(): string {
    const clientId = this.configService.get<string>('MCOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MCOM_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new Error('MCOM OAuth credentials not configured');
    }
    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  }

  private async get<T>(
    path: string,
    accessToken: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    });
    if (!response.ok) {
      throw new Error(`${path} failed (${response.status})`);
    }
    return (await response.json()) as T;
  }

  private async post<T>(
    path: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`${path} failed (${response.status}): ${detail}`);
      throw new Error(`${path} failed (${response.status})`);
    }
    return (await response.json()) as T;
  }

  private encryptionKey(): string {
    const key =
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('MCOM_HMAC_SECRET');
    if (!key) {
      throw new Error(
        'JWT_SECRET or MCOM_HMAC_SECRET is required to store MCOM tokens',
      );
    }
    return key;
  }

  private deriveKey(salt: crypto.BinaryLike): Buffer {
    return crypto.scryptSync(this.encryptionKey(), salt, 32);
  }

  private encryptToken(token: string): string {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.deriveKey(salt),
      iv,
    );
    const encrypted = cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
    return [
      'v2',
      salt.toString('hex'),
      iv.toString('hex'),
      cipher.getAuthTag().toString('hex'),
      encrypted,
    ].join(':');
  }

  private decryptToken(encryptedToken: string): string {
    const parts = encryptedToken.split(':');
    const versioned = parts[0] === 'v2';
    const [saltHex, ivHex, authTagHex, encrypted] = versioned
      ? parts.slice(1)
      : ['salt', ...parts.slice(0, 3)];
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Malformed encrypted MCOM token');
    }

    const salt = saltHex === 'salt' ? 'salt' : Buffer.from(saltHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.deriveKey(salt),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }
}
