import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

function mcomUrl(): string {
  return (
    process.env.MCOM_SOLUTIONS_URL || 'https://api.centralhubsolution.com'
  ).replace(/\/+$/, '');
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${mcomUrl()}/.well-known/jwks.json`));
  }
  return jwks;
}

interface AllowedCallersCache {
  callers: string[];
  expiresAt: number;
}

let allowedCallersCache: AllowedCallersCache | null = null;

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

async function getAllowedCallers(): Promise<string[]> {
  const configured = process.env.MCOM_ALLOWED_CALLERS;
  if (configured) {
    return configured
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (allowedCallersCache && allowedCallersCache.expiresAt > Date.now()) {
    return allowedCallersCache.callers;
  }

  try {
    const response = await fetch(`${mcomUrl()}/api/v1/ecosystem/services`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok)
      throw new Error(`Registry request failed (${response.status})`);
    const services = (await response.json()) as Array<{
      clientId?: string;
      allowedCallers?: string[];
    }>;
    const ownClientId = process.env.MCOM_CLIENT_ID;
    const ownService = services.find(
      (service) => service.clientId === ownClientId,
    );
    const callers = ownService?.allowedCallers || [];
    allowedCallersCache = { callers, expiresAt: Date.now() + 60_000 };
    return callers;
  } catch (error) {
    console.warn(
      'Failed to refresh allowed callers from registry:',
      error instanceof Error ? error.message : String(error),
    );
    return allowedCallersCache?.callers || [];
  }
}

export async function requireServiceAuth(
  req: AuthenticatedServiceRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res
      .status(401)
      .json({ error: 'Unauthorized: Missing Bearer service token' });
    return;
  }

  try {
    const audience = process.env.MCOM_CLIENT_ID;
    if (!audience) throw new Error('MCOM_CLIENT_ID is not configured');

    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: 'mcom-solutions',
      audience,
    });

    const actingAs = payload.act as { sub?: string } | undefined;
    const isDelegated = Boolean(actingAs?.sub) || payload.typ === 'delegated';
    const callerAppId = actingAs?.sub || payload.sub;
    if (typeof callerAppId !== 'string' || !callerAppId)
      throw new Error('Service token is missing a caller identity');

    const allowed = await getAllowedCallers();
    if (!allowed.includes('*') && !allowed.includes(callerAppId)) {
      res.status(403).json({
        error: `Forbidden: Caller "${callerAppId}" is not permitted to call this service`,
      });
      return;
    }

    req.serviceCaller = {
      callerAppId,
      isDelegated,
      userId:
        isDelegated && typeof payload.sub === 'string'
          ? payload.sub
          : undefined,
      scopes: typeof payload.scope === 'string' ? payload.scope.split(' ') : [],
      payload,
    };
    next();
  } catch (error) {
    console.error(
      'Service token verification failed:',
      error instanceof Error ? error.message : String(error),
    );
    res
      .status(401)
      .json({ error: 'Unauthorized: Invalid or expired service token' });
  }
}
