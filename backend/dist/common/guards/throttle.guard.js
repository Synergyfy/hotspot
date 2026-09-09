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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottleGuard = void 0;
const common_1 = require("@nestjs/common");
const attempts = new Map();
function getClientIp(context) {
    const request = context.switchToHttp().getRequest();
    return request.ip || request.connection?.remoteAddress || 'unknown';
}
let ThrottleGuard = class ThrottleGuard {
    maxAttempts;
    windowMs;
    constructor(maxAttempts = 10, windowMs = 60 * 1000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }
    canActivate(context) {
        const ip = getClientIp(context);
        const now = Date.now();
        const record = attempts.get(ip);
        if (!record || now > record.resetAt) {
            attempts.set(ip, { count: 1, resetAt: now + this.windowMs });
            return true;
        }
        record.count++;
        if (record.count > this.maxAttempts) {
            throw new common_1.HttpException('Too many requests. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.ThrottleGuard = ThrottleGuard;
exports.ThrottleGuard = ThrottleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Number, Number])
], ThrottleGuard);
//# sourceMappingURL=throttle.guard.js.map