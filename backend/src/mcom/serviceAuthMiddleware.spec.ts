import type { Response } from 'express';
import { jwtVerify } from 'jose';
import {
  requireServiceAuth,
  type AuthenticatedServiceRequest,
} from './serviceAuthMiddleware';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: jest.fn(),
}));

const verify = jwtVerify as jest.Mock;

function request(token?: string): AuthenticatedServiceRequest {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as AuthenticatedServiceRequest;
}

function response() {
  const status = jest.fn().mockReturnThis();
  const res = {
    status,
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { res, status };
}

describe('requireServiceAuth', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MCOM_CLIENT_ID = 'mcomhotspot';
    process.env.MCOM_ALLOWED_CALLERS = 'mcom-rewards, mcom-vcard';
    delete process.env.MCOM_SOLUTIONS_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects requests without a Bearer token', async () => {
    const { res, status } = response();
    const next = jest.fn();

    await requireServiceAuth(request(), res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts an allowed machine caller and attaches its identity', async () => {
    verify.mockResolvedValue({
      payload: {
        sub: 'mcom-rewards',
        scope: 'profile email',
        iss: 'mcom-solutions',
      },
    });
    const req = request('service-token');
    const { res } = response();
    const next = jest.fn();

    await requireServiceAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.serviceCaller).toMatchObject({
      callerAppId: 'mcom-rewards',
      isDelegated: false,
      scopes: ['profile', 'email'],
    });
  });

  it('rejects callers that are not in the allowlist', async () => {
    verify.mockResolvedValue({ payload: { sub: 'unknown-app' } });
    const { res, status } = response();
    const next = jest.fn();

    await requireServiceAuth(request('service-token'), res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('maps delegated tokens to the acting app and user', async () => {
    verify.mockResolvedValue({
      payload: { sub: 'usr_123', act: { sub: 'mcom-vcard' }, typ: 'delegated' },
    });
    const req = request('delegated-token');
    const { res } = response();
    const next = jest.fn();

    await requireServiceAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.serviceCaller).toMatchObject({
      callerAppId: 'mcom-vcard',
      isDelegated: true,
      userId: 'usr_123',
    });
  });
});
