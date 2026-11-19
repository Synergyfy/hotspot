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
const mcom_service_1 = require("./mcom.service");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
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
            membershipUrl: this.configService.get('MCOM_MEMBERSHIP_URL'),
            walletEnabled: this.configService.get('MCOM_WALLET_ENABLED') === 'true',
            configured: !!this.configService.get('MCOM_CLIENT_ID'),
        };
    }
    async login(res) {
        const state = crypto.randomBytes(32).toString('hex');
        const redirectUri = this.configService.get('MCOM_REDIRECT_URI') || 'http://localhost:3000/api/auth/sso/callback';
        res.cookie('mcom_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600000,
        });
        const authorizeUrl = this.mcomService.buildAuthorizeUrl(redirectUri, state);
        res.redirect(authorizeUrl);
    }
    async callback(code, state, req, res) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
        try {
            const cookieState = req?.cookies?.mcom_oauth_state;
            if (!cookieState || cookieState !== state) {
                return res.redirect(`${frontendUrl}/login?error=invalid_state`);
            }
            if (!code) {
                return res.redirect(`${frontendUrl}/login?error=missing_code`);
            }
            const tokenResponse = await this.mcomService.exchangeCode(code);
            const { access_token, refresh_token, expires_in, user: mcomUser } = tokenResponse;
            const permissions = mcomUser?.permissions;
            const platformSlug = this.configService.get('MCOM_PLATFORM_SLUG');
            if (permissions && !permissions[`canAccess_${platformSlug}`]) {
                return res.redirect(`${frontendUrl}/login?error=access_denied`);
            }
            const user = await this.mcomService.jitProvision(mcomUser, permissions);
            await this.mcomService.storeTokens(user.id, access_token, refresh_token, expires_in);
            const jwt = await this.mcomService.issueLocalJwt({
                email: user.email,
                id: user.id,
                role: user.role,
                isOnboarded: user.isOnboarded,
            });
            res.clearCookie('mcom_oauth_state');
            return res.redirect(`${frontendUrl}/auth/callback?token=${jwt}&role=${user.role}`);
        }
        catch (error) {
            this.logger.error('SSO callback error:', error);
            return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }
    }
    async refresh(body) {
        const tokens = await this.mcomService.getStoredTokens(body.userId);
        if (!tokens) {
            return { success: false, error: 'No tokens found' };
        }
        try {
            const refreshedTokens = await this.mcomService.refreshTokens(tokens.refreshToken);
            await this.mcomService.storeTokens(body.userId, refreshedTokens.access_token, refreshedTokens.refresh_token, refreshedTokens.expires_in);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Token refresh error:', error);
            return { success: false, error: 'Failed to refresh tokens' };
        }
    }
    async getStatus(userId, sync) {
        const status = await this.mcomService.getSsoStatus(userId);
        if (sync === 'true' && status?.connected) {
            const tokens = await this.mcomService.getStoredTokens(userId);
            if (tokens) {
                try {
                    const userInfo = await this.mcomService.fetchUserInfo(tokens.accessToken);
                    const permissions = await this.mcomService.fetchPermissions(tokens.accessToken);
                    await this.mcomService.jitProvision(userInfo, permissions);
                    return await this.mcomService.getSsoStatus(userId);
                }
                catch (error) {
                    this.logger.error('Status sync error:', error);
                }
            }
        }
        return status;
    }
    async getPermissions(userId) {
        const tokens = await this.mcomService.getStoredTokens(userId);
        if (!tokens) {
            return { error: 'No tokens found' };
        }
        try {
            return await this.mcomService.fetchPermissions(tokens.accessToken);
        }
        catch (error) {
            this.logger.error('Permissions fetch error:', error);
            return { error: 'Failed to fetch permissions' };
        }
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
    (0, common_1.Get)('login'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
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
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('status/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('sync')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('data/permissions'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "getPermissions", null);
exports.SsoController = SsoController = SsoController_1 = __decorate([
    (0, common_1.Controller)('auth/sso'),
    __metadata("design:paramtypes", [mcom_service_1.McomService,
        config_1.ConfigService])
], SsoController);
//# sourceMappingURL=sso.controller.js.map