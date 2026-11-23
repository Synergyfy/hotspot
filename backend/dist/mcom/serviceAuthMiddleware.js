"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireServiceAuth = requireServiceAuth;
const jose_1 = require("jose");
function mcomUrl() {
    return (process.env.MCOM_SOLUTIONS_URL || 'https://api.centralhubsolution.com').replace(/\/+$/, '');
}
let jwks;
function getJwks() {
    if (!jwks) {
        jwks = (0, jose_1.createRemoteJWKSet)(new URL(`${mcomUrl()}/.well-known/jwks.json`));
    }
    return jwks;
}
let allowedCallersCache = null;
async function getAllowedCallers() {
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
        const services = (await response.json());
        const ownClientId = process.env.MCOM_CLIENT_ID;
        const ownService = services.find((service) => service.clientId === ownClientId);
        const callers = ownService?.allowedCallers || [];
        allowedCallersCache = { callers, expiresAt: Date.now() + 60_000 };
        return callers;
    }
    catch (error) {
        console.warn('Failed to refresh allowed callers from registry:', error instanceof Error ? error.message : String(error));
        return allowedCallersCache?.callers || [];
    }
}
async function requireServiceAuth(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
        res
            .status(401)
            .json({ error: 'Unauthorized: Missing Bearer service token' });
        return;
    }
    try {
        const audience = process.env.MCOM_CLIENT_ID;
        if (!audience)
            throw new Error('MCOM_CLIENT_ID is not configured');
        const { payload } = await (0, jose_1.jwtVerify)(token, getJwks(), {
            issuer: 'mcom-solutions',
            audience,
        });
        const actingAs = payload.act;
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
            userId: isDelegated && typeof payload.sub === 'string'
                ? payload.sub
                : undefined,
            scopes: typeof payload.scope === 'string' ? payload.scope.split(' ') : [],
            payload,
        };
        next();
    }
    catch (error) {
        console.error('Service token verification failed:', error instanceof Error ? error.message : String(error));
        res
            .status(401)
            .json({ error: 'Unauthorized: Invalid or expired service token' });
    }
}
//# sourceMappingURL=serviceAuthMiddleware.js.map