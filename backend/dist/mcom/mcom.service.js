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
var McomService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McomService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const users_service_1 = require("../users/users.service");
const crypto = __importStar(require("crypto"));
let McomService = McomService_1 = class McomService {
    configService;
    jwtService;
    httpService;
    usersService;
    logger = new common_1.Logger(McomService_1.name);
    constructor(configService, jwtService, httpService, usersService) {
        this.configService = configService;
        this.jwtService = jwtService;
        this.httpService = httpService;
        this.usersService = usersService;
    }
    buildAuthorizeUrl(redirectUri, state) {
        const baseUrl = this.configService.get('MCOM_SOLUTIONS_URL');
        const clientId = this.configService.get('MCOM_CLIENT_ID');
        const scopes = this.configService.get('MCOM_SCOPES', 'profile email business membership packages');
        return `${baseUrl}/api/v1/auth/sso/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`;
    }
    async exchangeCode(code) {
        const baseUrl = this.configService.get('MCOM_SOLUTIONS_URL');
        const clientId = this.configService.get('MCOM_CLIENT_ID');
        const clientSecret = this.configService.get('MCOM_CLIENT_SECRET');
        const redirectUri = this.configService.get('MCOM_REDIRECT_URI');
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${baseUrl}/api/v1/auth/sso/token`, {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }, {
            headers: {
                Authorization: `Basic ${authHeader}`,
                'Content-Type': 'application/json',
            },
        }));
        return response.data;
    }
    async refreshTokens(refreshToken) {
        const baseUrl = this.configService.get('MCOM_SOLUTIONS_URL');
        const clientId = this.configService.get('MCOM_CLIENT_ID');
        const clientSecret = this.configService.get('MCOM_CLIENT_SECRET');
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${baseUrl}/api/v1/auth/sso/token/refresh`, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }, {
            headers: {
                Authorization: `Basic ${authHeader}`,
                'Content-Type': 'application/json',
            },
        }));
        return response.data;
    }
    async fetchUserInfo(accessToken) {
        const baseUrl = this.configService.get('MCOM_SOLUTIONS_URL');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${baseUrl}/api/v1/auth/sso/userinfo`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }));
        return response.data;
    }
    async fetchPermissions(accessToken) {
        const baseUrl = this.configService.get('MCOM_SOLUTIONS_URL');
        const hmacSecret = this.configService.get('MCOM_HMAC_SECRET');
        if (!hmacSecret) {
            throw new Error('MCOM_HMAC_SECRET not configured');
        }
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const method = 'GET';
        const path = '/api/v1/data/permissions';
        const body = '';
        const signaturePayload = `${method}${path}${timestamp}${body}`;
        const hmac = crypto.createHmac('sha256', hmacSecret).update(signaturePayload).digest('hex');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${baseUrl}${path}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Timestamp': timestamp,
                'X-Signature': hmac,
            },
        }));
        return response.data;
    }
    async jitProvision(mcomUser, permissions = null) {
        const platformSlug = this.configService.get('MCOM_PLATFORM_SLUG');
        let user = await this.usersService.findByMcomUserId(mcomUser.id);
        if (!user) {
            user = await this.usersService.findByEmail(mcomUser.email);
        }
        const mcomFields = {
            mcomUserId: mcomUser.id,
            mcomMembershipLevel: mcomUser.membershipLevel,
            mcomMembershipTier: mcomUser.membershipTier,
            mcomMembershipStatus: mcomUser.membershipStatus,
            mcomCanAccessVcard: permissions ? permissions[`canAccess_${platformSlug}`] === true : false,
        };
        if (user) {
            await this.usersService.updateMcomFields(user.id, mcomFields);
            user = await this.usersService.findById(user.id);
        }
        else {
            user = await this.usersService.create({
                email: mcomUser.email,
                name: mcomUser.name,
                role: mcomUser.role || 'agent',
                ...mcomFields,
            });
        }
        return user;
    }
    encryptToken(token) {
        const encryptionKey = this.configService.get('JWT_SECRET');
        if (!encryptionKey) {
            throw new Error('JWT_SECRET not configured');
        }
        const key = crypto.scryptSync(encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(token, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    decryptToken(encryptedToken) {
        const encryptionKey = this.configService.get('JWT_SECRET');
        if (!encryptionKey) {
            throw new Error('JWT_SECRET not configured');
        }
        const key = crypto.scryptSync(encryptionKey, 'salt', 32);
        const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async storeTokens(userId, accessToken, refreshToken, expiresIn) {
        const encryptedAccessToken = this.encryptToken(accessToken);
        const encryptedRefreshToken = this.encryptToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        await this.usersService.updateMcomFields(userId, {
            mcomAccessToken: encryptedAccessToken,
            mcomRefreshToken: encryptedRefreshToken,
            mcomTokenExpiresAt: expiresAt,
            mcomTokensUpdatedAt: new Date(),
        });
    }
    async issueLocalJwt(user) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            isOnboarded: user.isOnboarded,
        };
        return this.jwtService.signAsync(payload);
    }
    async getStoredTokens(userId) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.mcomAccessToken || !user.mcomRefreshToken) {
            return null;
        }
        return {
            accessToken: this.decryptToken(user.mcomAccessToken),
            refreshToken: this.decryptToken(user.mcomRefreshToken),
            expiresAt: user.mcomTokenExpiresAt,
        };
    }
    async getSsoStatus(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            return null;
        }
        return {
            connected: !!user.mcomUserId,
            membershipLevel: user.mcomMembershipLevel,
            membershipTier: user.mcomMembershipTier,
            membershipStatus: user.mcomMembershipStatus,
            canAccessVcard: user.mcomCanAccessVcard,
            tokenExpiresAt: user.mcomTokenExpiresAt,
            tokensUpdatedAt: user.mcomTokensUpdatedAt,
        };
    }
};
exports.McomService = McomService;
exports.McomService = McomService = McomService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService,
        axios_1.HttpService,
        users_service_1.UsersService])
], McomService);
//# sourceMappingURL=mcom.service.js.map