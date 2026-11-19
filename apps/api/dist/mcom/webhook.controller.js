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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const mcom_service_1 = require("./mcom.service");
const users_service_1 = require("../users/users.service");
const public_decorator_1 = require("../common/decorators/public.decorator");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let WebhookController = WebhookController_1 = class WebhookController {
    mcomService;
    configService;
    usersService;
    logger = new common_1.Logger(WebhookController_1.name);
    processedWebhooks = new Set();
    MAX_PROCESSED = 1000;
    constructor(mcomService, configService, usersService) {
        this.mcomService = mcomService;
        this.configService = configService;
        this.usersService = usersService;
    }
    async handleWebhook(req, res) {
        try {
            const rawBody = JSON.stringify(req.body);
            const signature = req.headers['x-webhook-signature'];
            if (!signature) {
                this.logger.warn('Webhook received without signature');
                return res.status(401).json({ error: 'Missing signature' });
            }
            const webhookSecret = this.configService.get('MCOM_WEBHOOK_SECRET');
            if (!webhookSecret) {
                this.logger.error('MCOM_WEBHOOK_SECRET not configured');
                return res.status(500).json({ error: 'Webhook secret not configured' });
            }
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                this.logger.warn('Webhook signature mismatch');
                return res.status(401).json({ error: 'Invalid signature' });
            }
            const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
            if (this.processedWebhooks.has(bodyHash)) {
                this.logger.log('Duplicate webhook received, skipping');
                return res.status(200).json({ success: true, duplicate: true });
            }
            this.processedWebhooks.add(bodyHash);
            if (this.processedWebhooks.size > this.MAX_PROCESSED) {
                const firstEntry = this.processedWebhooks.values().next().value;
                this.processedWebhooks.delete(firstEntry);
            }
            const { event, data } = req.body;
            await this.processEvent(event, data);
            return res.status(200).json({ success: true });
        }
        catch (error) {
            this.logger.error('Webhook processing error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    async processEvent(event, data) {
        const { userId, package: pkg, status } = data;
        this.logger.log(`Processing webhook event: ${event}`);
        const user = await this.usersService.findByMcomUserId(userId);
        if (!user) {
            this.logger.warn(`User not found for MCOM user ID: ${userId}`);
            return;
        }
        switch (event) {
            case 'package.created':
            case 'package.renewed':
                await this.usersService.updateMcomFields(user.id, {
                    mcomMembershipStatus: 'active',
                    mcomMembershipLevel: pkg?.level || user.mcomMembershipLevel,
                    mcomMembershipTier: pkg?.tier || user.mcomMembershipTier,
                    mcomCanAccessVcard: true,
                });
                this.logger.log(`Membership activated for user ${user.id}`);
                break;
            case 'package.cancelled':
            case 'package.expired':
                await this.usersService.updateMcomFields(user.id, {
                    mcomMembershipStatus: 'inactive',
                    mcomCanAccessVcard: false,
                });
                this.logger.log(`Membership deactivated for user ${user.id}`);
                break;
            case 'payment.failed':
                this.logger.warn(`Payment failed for user ${user.id}: ${JSON.stringify(data)}`);
                break;
            default:
                this.logger.log(`Unhandled webhook event: ${event}`);
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [mcom_service_1.McomService,
        config_1.ConfigService,
        users_service_1.UsersService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map