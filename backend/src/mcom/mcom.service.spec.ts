import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import type { UsersService } from '../users/users.service';
import { McomService } from './mcom.service';

type TokenCrypto = {
  encryptToken(token: string): string;
  decryptToken(value: string): string;
};

describe('McomService token storage', () => {
  let configGet: jest.Mock;
  let tokenCrypto: TokenCrypto;

  beforeEach(() => {
    configGet = jest.fn((key: string) =>
      key === 'MCOM_HMAC_SECRET' ? 'test-hmac-secret' : undefined,
    );
    const config = { get: configGet } as unknown as ConfigService;
    const service = new McomService(
      config,
      {} as unknown as JwtService,
      {} as unknown as UsersService,
    );
    tokenCrypto = service as unknown as TokenCrypto;
  });

  it('round-trips tokens with a per-record salt', () => {
    const encrypted = tokenCrypto.encryptToken('sensitive-token');

    expect(encrypted).toMatch(/^v2:[0-9a-f]{32}:[0-9a-f]{32}:/);
    expect(encrypted).not.toContain('sensitive-token');
    expect(tokenCrypto.decryptToken(encrypted)).toBe('sensitive-token');
    expect(tokenCrypto.encryptToken('sensitive-token')).not.toBe(encrypted);
  });

  it('still reads legacy fixed-salt ciphertext', () => {
    const key = crypto.scryptSync('test-hmac-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted =
      cipher.update('legacy-token', 'utf8', 'hex') + cipher.final('hex');
    const legacy = `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted}`;

    expect(tokenCrypto.decryptToken(legacy)).toBe('legacy-token');
  });

  it('refuses to store tokens without a key', () => {
    configGet.mockReturnValue(undefined);

    expect(() => tokenCrypto.encryptToken('token')).toThrow(
      /JWT_SECRET or MCOM_HMAC_SECRET/,
    );
  });
});

describe('McomService authorize URL', () => {
  const buildUrl = (values: Record<string, string>) => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
    } as unknown as ConfigService;
    const service = new McomService(
      config,
      {} as unknown as JwtService,
      {} as unknown as UsersService,
    );

    return new URL(
      service.buildAuthorizeUrl('http://localhost:5173/auth/callback', 'state'),
    );
  };

  it('requests only profile, email and business scopes by default', () => {
    const url = buildUrl({
      MCOM_SOLUTIONS_URL: 'https://mcom.example',
      MCOM_CLIENT_ID: 'client-id',
    });

    expect(url.pathname).toBe('/api/v1/auth/sso/authorize');
    expect(url.searchParams.get('scope')).toBe('profile email business');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('state')).toBe('state');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:5173/auth/callback',
    );
  });

  it('allows MCOM_SCOPES to override the default', () => {
    const url = buildUrl({
      MCOM_SOLUTIONS_URL: 'https://mcom.example',
      MCOM_CLIENT_ID: 'client-id',
      MCOM_SCOPES: 'profile email',
    });

    expect(url.searchParams.get('scope')).toBe('profile email');
  });
});

describe('McomService token exchange', () => {
  it('sends client_id in the token request body', async () => {
    const values: Record<string, string> = {
      MCOM_SOLUTIONS_URL: 'http://localhost:3010',
      MCOM_CLIENT_ID: 'client-id',
      MCOM_CLIENT_SECRET: 'client-secret',
      MCOM_HMAC_SECRET: 'test-hmac-secret',
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
    } as unknown as ConfigService;
    const service = new McomService(
      config,
      {} as unknown as JwtService,
      {} as unknown as UsersService,
    );
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'access',
          refresh_token: 'refresh',
          expires_in: 3600,
        }),
    });
    global.fetch = fetchMock;

    try {
      await service.exchangeCode('code', 'http://localhost:5174/');
    } finally {
      global.fetch = originalFetch;
    }

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3010/api/v1/auth/sso/token');
    expect(JSON.parse(init.body as string)).toMatchObject({
      grant_type: 'authorization_code',
      client_id: 'client-id',
      code: 'code',
      redirect_uri: 'http://localhost:5174/',
    });
  });
});
