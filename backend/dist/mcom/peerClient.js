"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceToken = getServiceToken;
exports.callPeer = callPeer;
exports.getDelegatedUserToken = getDelegatedUserToken;
const tokenCache = new Map();
function requiredConfig(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`${name} is not configured`);
    return value;
}
function basicAuth() {
    return Buffer.from(`${requiredConfig('MCOM_CLIENT_ID')}:${requiredConfig('MCOM_CLIENT_SECRET')}`).toString('base64');
}
function mcomUrl() {
    return requiredConfig('MCOM_SOLUTIONS_URL').replace(/\/+$/, '');
}
function defaultScope() {
    return process.env.MCOM_SERVICE_SCOPES || 'service:read';
}
function tokenFrom(data) {
    const token = data.access_token || data.accessToken;
    if (!token)
        throw new Error('MCOM service token response is missing an access token');
    return token;
}
function expiryFrom(data) {
    const seconds = data.expires_in ?? data.expiresIn ?? 300;
    return Date.now() + seconds * 1000;
}
async function getServiceToken(audience, scope = defaultScope()) {
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
    const data = (await response.json());
    const token = tokenFrom(data);
    tokenCache.set(cacheKey, { token, expiresAt: expiryFrom(data) });
    return token;
}
async function callPeer(peerBaseUrl, targetAudience, path, options = {}) {
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
        throw new Error(`Peer call to ${targetAudience} failed (${response.status})`);
    }
    return (await response.json());
}
async function getDelegatedUserToken(userSsoAccessToken, targetAudience, scope = defaultScope()) {
    const response = await fetch(`${mcomUrl()}/api/v1/auth/service-token/exchange`, {
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
    });
    if (!response.ok) {
        throw new Error(`MCOM delegated token exchange failed (${response.status})`);
    }
    return tokenFrom((await response.json()));
}
//# sourceMappingURL=peerClient.js.map