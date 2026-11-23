import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
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
export interface SsoCompletion {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    user: McomIdentity;
    entitlement?: McomEntitlement;
}
export declare class McomService {
    private readonly configService;
    private readonly jwtService;
    private readonly usersService;
    private readonly logger;
    constructor(configService: ConfigService, jwtService: JwtService, usersService: UsersService);
    get frontendUrl(): string;
    get redirectUri(): string;
    isConfigured(): boolean;
    buildAuthorizeUrl(redirectUri: string, state: string): string;
    exchangeCode(code: string, redirectUri?: string): Promise<SsoCompletion>;
    refreshTokens(refreshToken: string): Promise<SsoCompletion>;
    checkCentralHealth(): Promise<{
        reachable: boolean;
        status?: number;
        error?: string;
    }>;
    fetchEntitlement(accessToken: string): Promise<McomEntitlement>;
    fetchEntitlementByUserId(userId: string | number): Promise<McomEntitlement>;
    fetchUserInfo(accessToken: string): Promise<McomIdentity>;
    fetchPermissions(accessToken: string): Promise<Record<string, boolean>>;
    jitProvision(mcomUser: McomIdentity, permissions?: Record<string, boolean> | null): Promise<{
        id: number;
        email: string;
        mcomUserId: string | null;
        password: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        isOnboarded: boolean;
        mcomAccessToken: string | null;
        mcomRefreshToken: string | null;
        mcomTokenExpiresAt: Date | null;
        mcomTokensUpdatedAt: Date | null;
        mcomMembershipLevel: string | null;
        mcomMembershipStatus: string | null;
        mcomMembershipTier: string | null;
        mcomCanAccessVcard: boolean;
        mcomBusinessProfile: import("@prisma/client/runtime/library").JsonValue | null;
        role: string;
        isAffiliate: boolean;
        firstName: string | null;
        lastName: string | null;
        jobTitle: string | null;
        phone: string | null;
        address: string | null;
        postcode: string | null;
        country: string | null;
        companyName: string | null;
        companyType: string | null;
        companyIndustry: string | null;
        companyWebsite: string | null;
        companyLogo: string | null;
    }>;
    storeTokens(userId: number, accessToken?: string, refreshToken?: string, expiresIn?: number): Promise<void>;
    getStoredTokens(userId: number): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date | null;
    } | null>;
    getSsoStatus(userId: number): Promise<{
        connected: boolean;
        membershipLevel: string | null;
        membershipTier: string | null;
        membershipStatus: string | null;
        canAccessVcard: boolean;
        tokenExpiresAt: Date | null;
        tokensUpdatedAt: Date | null;
    } | null>;
    issueLocalJwt(user: {
        email: string;
        id: number;
        role: string;
        isOnboarded: boolean;
    }): Promise<string>;
    private normalizeCompletion;
    private baseUrl;
    private basicAuth;
    private get;
    private post;
    private encryptionKey;
    private deriveKey;
    private encryptToken;
    private decryptToken;
}
