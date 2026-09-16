import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(context: ExecutionContext): string {
  const request = context.switchToHttp().getRequest();
  return request.ip || request.connection?.remoteAddress || 'unknown';
}

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(
    private readonly maxAttempts: number = 10,
    private readonly windowMs: number = 60 * 1000, // 1 minute
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const ip = getClientIp(context);
    const now = Date.now();
    const record = attempts.get(ip);

    if (!record || now > record.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    record.count++;
    if (record.count > this.maxAttempts) {
      throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
