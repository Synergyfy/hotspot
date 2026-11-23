"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HandshakeController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandshakeController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mcom_service_1 = require("./mcom.service");
let HandshakeController = HandshakeController_1 = class HandshakeController {
    mcomService;
    jwtService;
    configService;
    logger = new common_1.Logger(HandshakeController_1.name);
    constructor(mcomService, jwtService, configService) {
        this.mcomService = mcomService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async ssoLogin(token, res) {
        try {
            const result = await this.authenticate(token);
            return res.redirect(`${this.mcomService.frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}&role=${encodeURIComponent(result.user.role)}`);
        }
        catch (error) {
            this.logger.error(`SSO handshake failed: ${error instanceof Error ? error.message : String(error)}`);
            return res.redirect(`${this.mcomService.frontendUrl}/login?error=invalid_token`);
        }
    }
    async completeHandshake(body) {
        return this.authenticate(body?.token);
    }
    async authenticate(token) {
        if (!token)
            throw new common_1.BadRequestException('missing_token');
        const secret = this.configService.get('SSO_SECRET');
        if (!secret)
            throw new common_1.UnauthorizedException('SSO_SECRET not configured');
        const payload = await this.jwtService.verifyAsync(token, {
            secret,
            issuer: 'mcom-central',
        });
        const mcomUser = {
            id: payload.sub || payload.mcomUserId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            membershipLevel: payload.membershipLevel,
            membershipTier: payload.membershipTier,
            membershipStatus: payload.membershipStatus,
            permissions: payload.permissions,
        };
        const user = await this.mcomService.jitProvision(mcomUser);
        const localToken = await this.mcomService.issueLocalJwt({
            email: user.email,
            id: user.id,
            role: user.role,
            isOnboarded: user.isOnboarded,
        });
        return {
            token: localToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isOnboarded: user.isOnboarded,
            },
        };
    }
};
exports.HandshakeController = HandshakeController;
__decorate([
    (0, common_1.Get)('sso-login'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HandshakeController.prototype, "ssoLogin", null);
__decorate([
    (0, common_1.Post)('sso/complete-handshake'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HandshakeController.prototype, "completeHandshake", null);
exports.HandshakeController = HandshakeController = HandshakeController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [mcom_service_1.McomService,
        jwt_1.JwtService,
        config_1.ConfigService])
], HandshakeController);
//# sourceMappingURL=handshake.controller.js.map