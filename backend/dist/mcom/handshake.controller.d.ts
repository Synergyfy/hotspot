import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { McomService } from './mcom.service';
export declare class HandshakeController {
    private readonly mcomService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(mcomService: McomService, jwtService: JwtService, configService: ConfigService);
    ssoLogin(token: string, res: Response): Promise<void>;
    completeHandshake(body: {
        token?: string;
    }): Promise<{
        token: string;
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
            isOnboarded: boolean;
        };
    }>;
    private authenticate;
}
