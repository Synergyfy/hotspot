import type { Request, Response } from 'express';
import { McomService } from './mcom.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
export declare class WebhookController {
    private mcomService;
    private configService;
    private usersService;
    private readonly logger;
    private processedWebhooks;
    private readonly MAX_PROCESSED;
    constructor(mcomService: McomService, configService: ConfigService, usersService: UsersService);
    handleWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private processEvent;
}
