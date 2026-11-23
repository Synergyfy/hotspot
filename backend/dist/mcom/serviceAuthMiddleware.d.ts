import type { NextFunction, Request, Response } from 'express';
import { type JWTPayload } from 'jose';
export interface ServiceCaller {
    callerAppId: string;
    isDelegated: boolean;
    userId?: string;
    scopes: string[];
    payload: JWTPayload;
}
export interface AuthenticatedServiceRequest extends Request {
    serviceCaller?: ServiceCaller;
}
export declare function requireServiceAuth(req: AuthenticatedServiceRequest, res: Response, next: NextFunction): Promise<void>;
