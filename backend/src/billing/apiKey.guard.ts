import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header =
      request.headers['x-mcom-solution-api-key'] ||
      request.headers['x-api-key'];
    const provided = Array.isArray(header) ? header[0] : header;
    const expected = process.env.MCOM_API_KEY;

    if (!expected || !provided) {
      throw new UnauthorizedException('Invalid or missing X-API-Key');
    }

    const actual = Buffer.from(provided);
    const desired = Buffer.from(expected);
    if (actual.length !== desired.length || !timingSafeEqual(actual, desired)) {
      throw new UnauthorizedException('Invalid or missing X-API-Key');
    }

    return true;
  }
}
