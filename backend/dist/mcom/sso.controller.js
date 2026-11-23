"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SsoController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const mcom_service_1 = require("./mcom.service");
const STATE_COOKIE = 'mcom_oauth_state';
let SsoController = SsoController_1 = class SsoController {
    mcomService;
    configService;
    logger = new common_1.Logger(SsoController_1.name);
    constructor(mcomService, configService) {
        this.mcomService = mcomService;
        this.configService = configService;
    }
    getConfig() {
        return {
            configured: this.mcomService.isConfigured(),
            membershipUrl: this.configService.get('MCOM_MEMBERSHIP_URL'),
            walletEnabled: this.configService.get('MCOM_WALLET_ENABLED') === 'true',
        };
    }
    health() {
        return this.mcomService.checkCentralHealth();
    }
    login(res) {
        const frontendUrl = this.mcomService.frontendUrl;
        if (!this.mcomService.isConfigured()) {
            return res.redirect(`${frontendUrl}/login?error=not_configured`);
        }
        const state = crypto.randomBytes(32).toString('hex');
        res.cookie(STATE_COOKIE, state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600000,
            path: '/',
        });
        return res.redirect(this.mcomService.buildAuthorizeUrl(this.mcomService.redirectUri, state));
    }
    async callback(code, state, req, res) {
        try {
            const result = await this.completeSso(code, state, this.readCookie(req, STATE_COOKIE));
            res.clearCookie(STATE_COOKIE, { path: '/' });
            return res.redirect(`${this.mcomService.frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}&role=${encodeURIComponent(result.user.role)}`);
        }
        catch (error) {
            this.logger.error(`SSO callback failed: ${this.errorMessage(error)}`);
            const code = this.errorCode(error);
            const upgradeUrl = error
                .upgradeUrl;
            if (this.isUpgradeReason(code)) {
                return res.redirect(`${this.mcomService.frontendUrl}/upgrade?reason=${encodeURIComponent(code)}&upgradeUrl=${encodeURIComponent(upgradeUrl || '')}`);
            }
            return res.redirect(`${this.mcomService.frontendUrl}/login?error=${encodeURIComponent(code)}`);
        }
    }
    async complete(body, req) {
        try {
            return await this.completeSso(body?.code, body?.state, this.readCookie(req, STATE_COOKIE));
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`SSO completion failed: ${this.errorMessage(error)}`);
            throw new common_1.BadRequestException('oauth_failed');
        }
    }
    async refresh(body, req) {
        const userId = this.authenticatedUserId(req);
        const requested = Number(body?.userId);
        if (body?.userId !== undefined && requested !== userId) {
            throw new common_1.ForbiddenException('Forbidden');
        }
        const tokens = await this.mcomService.getStoredTokens(userId);
        if (!tokens) {
            return { success: false, error: 'No tokens found' };
        }
        try {
            const refreshed = await this.mcomService.refreshTokens(tokens.refreshToken);
            await this.mcomService.storeTokens(userId, refreshed.accessToken, refreshed.refreshToken, refreshed.expiresIn);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Token refresh failed: ${this.errorMessage(error)}`);
            return { success: false, error: 'Failed to refresh tokens' };
        }
    }
    async status(userId, sync, req) {
        const id = this.authenticatedUserId(req);
        if (Number(userId) !== id)
            throw new common_1.ForbiddenException('Forbidden');
        const status = await this.mcomService.getSsoStatus(id);
        if (sync !== 'true' || !status?.connected) {
            return status;
        }
        const tokens = await this.mcomService.getStoredTokens(id);
        if (!tokens)
            return status;
        try {
            const userInfo = await this.mcomService.fetchUserInfo(tokens.accessToken);
            const permissions = await this.mcomService.fetchPermissions(tokens.accessToken);
            await this.mcomService.jitProvision(userInfo, permissions);
            return this.mcomService.getSsoStatus(id);
        }
        catch (error) {
            this.logger.error(`SSO status sync failed: ${this.errorMessage(error)}`);
            return status;
        }
    }
    async permissions(userId, req) {
        const id = this.authenticatedUserId(req);
        const requested = Number(userId);
        if (userId !== undefined && requested !== id) {
            throw new common_1.ForbiddenException('Forbidden');
        }
        const tokens = await this.mcomService.getStoredTokens(id);
        if (!tokens)
            return { error: 'No tokens found' };
        try {
            return await this.mcomService.fetchPermissions(tokens.accessToken);
        }
        catch (error) {
            this.logger.error(`Permissions fetch failed: ${this.errorMessage(error)}`);
            return { error: 'Failed to fetch permissions' };
        }
    }
    async completeSso(code, state, cookieState) {
        if (!code)
            throw new common_1.BadRequestException('missing_code');
        if (!state || !cookieState || state !== cookieState) {
            throw new common_1.BadRequestException('invalid_state');
        }
        const tokenResponse = await this.mcomService.exchangeCode(code);
        let mcomUser = tokenResponse.user;
        if (!mcomUser?.email) {
            mcomUser = await this.mcomService.fetchUserInfo(tokenResponse.accessToken);
        }
        let entitlement = tokenResponse.entitlement;
        if (entitlement?.access?.hasAccess === undefined) {
            entitlement = await this.mcomService
                .fetchEntitlement(tokenResponse.accessToken)
                .catch(() => undefined);
        }
        let permissions = mcomUser?.permissions || null;
        if (!permissions) {
            permissions = await this.mcomService
                .fetchPermissions(tokenResponse.accessToken)
                .catch(() => null);
        }
        if (entitlement?.access?.hasAccess !== true) {
            const denial = new common_1.ForbiddenException(entitlement?.access?.reason || 'access_denied');
            denial.upgradeUrl =
                entitlement?.access?.upgradeUrl;
            throw denial;
        }
        if (entitlement?.whitelabel?.enabled) {
            const identity = mcomUser;
            const profileTypeValue = identity?.profileType ?? identity?.role;
            const profileType = typeof profileTypeValue === 'string' ? profileTypeValue : undefined;
            const isBusiness = profileType === 'BUSINESS';
            const granted = isBusiness &&
                entitlement.access?.accessType === 'WHITELABEL' &&
                entitlement.whitelabel.granted === true &&
                entitlement.whitelabel.roleEligible !== false;
            if (!granted) {
                throw new common_1.ForbiddenException(isBusiness ? 'WHITELABEL_ACCESS_DENIED' : 'WHITELABEL_BUSINESS_ONLY');
            }
        }
        const user = await this.mcomService.jitProvision(mcomUser, permissions);
        await this.mcomService.storeTokens(user.id, tokenResponse.accessToken, tokenResponse.refreshToken, tokenResponse.expiresIn);
        const token = await this.mcomService.issueLocalJwt({
            email: user.email,
            id: user.id,
            role: user.role,
            isOnboarded: user.isOnboarded,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isOnboarded: user.isOnboarded,
            },
        };
    }
    authenticatedUserId(req) {
        const raw = req?.user?.userId ?? req?.user?.sub;
        const id = Number(raw);
        if (raw === undefined || raw === null || !Number.isFinite(id)) {
            throw new common_1.ForbiddenException('Forbidden');
        }
        return id;
    }
    readCookie(req, name) {
        const cookie = req?.headers?.cookie
            ?.split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${name}=`));
        return cookie
            ? decodeURIComponent(cookie.slice(name.length + 1))
            : undefined;
    }
    isUpgradeReason(code) {
        return [
            'SUBSCRIPTION_REQUIRED',
            'NO_ACTIVE_PLAN',
            'PLAN_REQUIRED',
            'TRIAL_EXPIRED',
            'PAYMENT_FAILED',
        ].includes(code);
    }
    errorCode(error) {
        if (error instanceof common_1.BadRequestException)
            return String(error.message);
        if (error instanceof common_1.ForbiddenException) {
            const reason = String(error.message);
            return /^[A-Z_]+$/.test(reason) ? reason : 'access_denied';
        }
        return 'oauth_failed';
    }
    errorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
};
exports.SsoController = SsoController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SsoController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SsoController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('login'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SsoController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "callback", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('status/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('sync')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('data/permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "permissions", null);
exports.SsoController = SsoController = SsoController_1 = __decorate([
    (0, common_1.Controller)('auth/sso'),
    __metadata("design:paramtypes", [mcom_service_1.McomService,
        config_1.ConfigService])
], SsoController);
//# sourceMappingURL=sso.controller.js.map