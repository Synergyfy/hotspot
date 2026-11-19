import type { Response } from 'express';
import { McomService } from './mcom.service';
import { ConfigService } from '@nestjs/config';
export declare class HandshakeController {
    private mcomService;
    private configService;
    private readonly logger;
    constructor(mcomService: McomService, configService: ConfigService);
    ssoLogin(token: string, res: Response): Promise<void>;
}
