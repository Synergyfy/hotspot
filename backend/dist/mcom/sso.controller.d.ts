import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { McomService } from './mcom.service';
interface AuthenticatedRequest extends Request {
    user?: {
        userId?: number | string;
        sub?: number | string;
    };
}
export declare class SsoController {
    private readonly mcomService;
    private readonly configService;
    private readonly logger;
    constructor(mcomService: McomService, configService: ConfigService);
    getConfig(): {
        configured: boolean;
        membershipUrl: string | undefined;
        walletEnabled: boolean;
    };
    health(): Promise<{
        reachable: boolean;
        status?: number;
        error?: string;
    }>;
    login(res: Response): void;
    callback(code: string, state: string, req: Request, res: Response): Promise<void>;
    complete(body: {
        code?: string;
        state?: string;
    }, req: Request): Promise<{
        token: string;
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
            isOnboarded: boolean;
        };
    }>;
    refresh(body: {
        userId?: number;
    }, req: AuthenticatedRequest): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    status(userId: string, sync?: string, req?: AuthenticatedRequest): Promise<{
        connected: boolean;
        membershipLevel: string | null;
        membershipTier: string | null;
        membershipStatus: string | null;
        canAccessVcard: boolean;
        tokenExpiresAt: Date | null;
        tokensUpdatedAt: Date | null;
    } | null>;
    permissions(userId: string, req: AuthenticatedRequest): Promise<Record<string, boolean> | {
        error: string;
    }>;
    private completeSso;
    private authenticatedUserId;
    private readCookie;
    private isUpgradeReason;
    private errorCode;
    private errorMessage;
}
export {};
