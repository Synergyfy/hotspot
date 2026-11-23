interface CachedToken {
  token: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token?: string;
  accessToken?: string;
  expires_in?: number;
  expiresIn?: number;
  token_type?: string;
}

const tokenCache = new Map<string, CachedToken>();

function requiredConfig(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function basicAuth(): string {
  return Buffer.from(
    `${requiredConfig('MCOM_CLIENT_ID')}:${requiredConfig('MCOM_CLIENT_SECRET')}`,
  ).toString('base64');
}

function mcomUrl(): string {
  return requiredConfig('MCOM_SOLUTIONS_URL').replace(/\/+$/, '');
}

function defaultScope(): string {
  return process.env.MCOM_SERVICE_SCOPES || 'service:read';
}

function tokenFrom(data: TokenResponse): string {
  const token = data.access_token || data.accessToken;
  if (!token)
    throw new Error('MCOM service token response is missing an access token');
  return token;
}

function expiryFrom(data: TokenResponse): number {
  const seconds = data.expires_in ?? data.expiresIn ?? 300;
  return Date.now() + seconds * 1000;
}

export async function getServiceToken(
  audience: string,
  scope = defaultScope(),
): Promise<string> {
  const cacheKey = `${audience}:${scope}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const response = await fetch(`${mcomUrl()}/api/v1/auth/service-token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials', audience, scope }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`MCOM service token request failed (${response.status})`);
  }

  const data = (await response.json()) as TokenResponse;
  const token = tokenFrom(data);
  tokenCache.set(cacheKey, { token, expiresAt: expiryFrom(data) });
  return token;
}

export async function callPeer<T>(
  peerBaseUrl: string,
  targetAudience: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const token = await getServiceToken(targetAudience);
  const url = `${peerBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Origin-App': requiredConfig('MCOM_CLIENT_ID'),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(
      `Peer call to ${targetAudience} failed (${response.status})`,
    );
  }

  return (await response.json()) as T;
}

export async function getDelegatedUserToken(
  userSsoAccessToken: string,
  targetAudience: string,
  scope = defaultScope(),
): Promise<string> {
  const response = await fetch(
    `${mcomUrl()}/api/v1/auth/service-token/exchange`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject_token: userSsoAccessToken,
        audience: targetAudience,
        scope,
      }),
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `MCOM delegated token exchange failed (${response.status})`,
    );
  }

  return tokenFrom((await response.json()) as TokenResponse);
}
