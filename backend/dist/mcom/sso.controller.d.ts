import type { Response, Request } from 'express';
import { McomService } from './mcom.service';
import { ConfigService } from '@nestjs/config';
export declare class SsoController {
    private mcomService;
    private configService;
    private readonly logger;
    constructor(mcomService: McomService, configService: ConfigService);
    getConfig(): {
        membershipUrl: string | undefined;
        walletEnabled: boolean;
        configured: boolean;
    };
    login(res: Response): Promise<void>;
    callback(code: string, state: string, req: Request, res: Response): Promise<void>;
    refresh(body: {
        userId: number;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    getStatus(userId: number, sync?: string): Promise<{
        connected: boolean;
        membershipLevel: string | null;
        membershipTier: string | null;
        membershipStatus: string | null;
        canAccessVcard: boolean;
        tokenExpiresAt: Date | null;
        tokensUpdatedAt: Date | null;
    } | null>;
    getPermissions(userId: number): Promise<{
        [key: string]: boolean;
    } | {
        error: string;
    }>;
}
