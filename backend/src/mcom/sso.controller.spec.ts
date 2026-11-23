import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type {
  McomEntitlement,
  McomIdentity,
  McomService,
  SsoCompletion,
} from './mcom.service';
import { SsoController } from './sso.controller';

type McomMock = jest.Mocked<
  Pick<
    McomService,
    | 'exchangeCode'
    | 'fetchUserInfo'
    | 'fetchEntitlement'
    | 'fetchPermissions'
    | 'jitProvision'
    | 'storeTokens'
    | 'issueLocalJwt'
  >
>;

type SsoInternals = {
  completeSso(
    code?: string,
    state?: string,
    cookieState?: string,
  ): Promise<{ token: string; user: unknown }>;
};

describe('SsoController entitlement gate', () => {
  const localUser = {
    id: 7,
    email: 'owner@example.com',
    name: 'Acme',
    role: 'BUSINESS',
    isOnboarded: true,
  };
  const ssoUser: McomIdentity = {
    id: 'usr_biz',
    email: 'owner@example.com',
    profileType: 'BUSINESS',
    role: 'BUSINESS',
  };
  const completion = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 300,
    user: ssoUser,
  } as SsoCompletion;

  let mcomService: McomMock;
  let controller: SsoController;
  let internals: SsoInternals;

  const entitled = (entitlement: McomEntitlement): SsoCompletion => ({
    ...completion,
    entitlement,
  });

  beforeEach(() => {
    mcomService = {
      exchangeCode: jest.fn().mockResolvedValue(completion),
      fetchUserInfo: jest.fn(),
      fetchEntitlement: jest.fn().mockResolvedValue({
        access: { hasAccess: true },
      }),
      fetchPermissions: jest
        .fn()
        .mockResolvedValue({ canAccess_hotspot: true }),
      jitProvision: jest.fn().mockResolvedValue(localUser),
      storeTokens: jest.fn().mockResolvedValue(undefined),
      issueLocalJwt: jest.fn().mockResolvedValue('local-jwt'),
    };
    controller = new SsoController(
      mcomService as unknown as McomService,
      {
        get: jest.fn().mockReturnValue('hotspot'),
      } as unknown as ConfigService,
    );
    internals = controller as unknown as SsoInternals;
  });

  const complete = () => internals.completeSso('code', 'state', 'state');

  it('denies access when entitlement is unavailable', async () => {
    mcomService.fetchEntitlement.mockRejectedValue(new Error('offline'));

    await expect(complete()).rejects.toThrow(ForbiddenException);
    await expect(complete()).rejects.toThrow('access_denied');
  });

  it('denies access with the central reason and upgrade URL', async () => {
    mcomService.exchangeCode.mockResolvedValue(
      entitled({
        access: {
          hasAccess: false,
          reason: 'TRIAL_EXPIRED',
          upgradeUrl: 'https://billing.example.com/upgrade',
        },
      }),
    );

    await expect(complete()).rejects.toMatchObject({
      message: 'TRIAL_EXPIRED',
      upgradeUrl: 'https://billing.example.com/upgrade',
    });
  });

  it('denies non-business accounts in white-label mode', async () => {
    mcomService.exchangeCode.mockResolvedValue({
      ...completion,
      user: { ...ssoUser, profileType: 'CUSTOMER' },
      entitlement: {
        access: { hasAccess: true, accessType: 'WHITELABEL' },
        whitelabel: { enabled: true, granted: true },
      },
    });

    await expect(complete()).rejects.toThrow('WHITELABEL_BUSINESS_ONLY');
  });

  it('denies granted white-label businesses without an explicit grant', async () => {
    mcomService.exchangeCode.mockResolvedValue(
      entitled({
        access: { hasAccess: true, accessType: 'WHITELABEL' },
        whitelabel: { enabled: true, granted: false },
      }),
    );

    await expect(complete()).rejects.toThrow('WHITELABEL_ACCESS_DENIED');
  });

  it('rejects an invalid OAuth state', async () => {
    await expect(
      internals.completeSso('code', 'other-state', 'state'),
    ).rejects.toThrow('invalid_state');
  });

  it('signs in entitled users and provisions their local account', async () => {
    await expect(complete()).resolves.toEqual({
      token: 'local-jwt',
      user: localUser,
    });
    expect(mcomService.jitProvision).toHaveBeenCalledWith(
      ssoUser,
      expect.objectContaining({ canAccess_hotspot: true }),
    );
    expect(mcomService.storeTokens).toHaveBeenCalledWith(
      7,
      'access-token',
      'refresh-token',
      300,
    );
  });

  it('signs in granted white-label businesses', async () => {
    mcomService.exchangeCode.mockResolvedValue(
      entitled({
        access: { hasAccess: true, accessType: 'WHITELABEL' },
        whitelabel: { enabled: true, granted: true },
      }),
    );

    await expect(complete()).resolves.toMatchObject({ token: 'local-jwt' });
  });
});
