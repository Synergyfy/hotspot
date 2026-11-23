"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let ApiKeyGuard = class ApiKeyGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const header = request.headers['x-mcom-solution-api-key'] ||
            request.headers['x-api-key'];
        const provided = Array.isArray(header) ? header[0] : header;
        const expected = process.env.MCOM_API_KEY;
        if (!expected || !provided) {
            throw new common_1.UnauthorizedException('Invalid or missing X-API-Key');
        }
        const actual = Buffer.from(provided);
        const desired = Buffer.from(expected);
        if (actual.length !== desired.length || !(0, crypto_1.timingSafeEqual)(actual, desired)) {
            throw new common_1.UnauthorizedException('Invalid or missing X-API-Key');
        }
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)()
], ApiKeyGuard);
//# sourceMappingURL=apiKey.guard.js.map