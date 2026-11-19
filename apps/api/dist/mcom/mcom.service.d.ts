import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { UsersService } from '../users/users.service';
export declare class McomService {
    private configService;
    private jwtService;
    private httpService;
    private usersService;
    private readonly logger;
    constructor(configService: ConfigService, jwtService: JwtService, httpService: HttpService, usersService: UsersService);
    buildAuthorizeUrl(redirectUri: string, state: string): string;
    exchangeCode(code: string): Promise<{
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
    }>;
    refreshTokens(refreshToken: string): Promise<{
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
    }>;
    fetchUserInfo(accessToken: string): Promise<{
        id: string;
        email: string;
        name: string;
    }>;
    fetchPermissions(accessToken: string): Promise<{
        [key: string]: boolean;
    }>;
    jitProvision(mcomUser: any, permissions?: any): Promise<import("../entities/user.entity").User | null>;
    encryptToken(token: string): string;
    decryptToken(encryptedToken: string): string;
    storeTokens(userId: number, accessToken: string, refreshToken: string, expiresIn: number): Promise<void>;
    issueLocalJwt(user: {
        email: string;
        id: number;
        role: string;
        isOnboarded: boolean;
    }): Promise<string>;
    getStoredTokens(userId: number): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    } | null>;
    getSsoStatus(userId: number): Promise<{
        connected: boolean;
        membershipLevel: string;
        membershipTier: string;
        membershipStatus: string;
        canAccessVcard: boolean;
        tokenExpiresAt: Date;
        tokensUpdatedAt: Date;
    } | null>;
}
