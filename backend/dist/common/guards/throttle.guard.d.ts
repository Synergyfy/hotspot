import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ThrottleGuard implements CanActivate {
    private readonly maxAttempts;
    private readonly windowMs;
    constructor(maxAttempts?: number, windowMs?: number);
    canActivate(context: ExecutionContext): boolean;
}
