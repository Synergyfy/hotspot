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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const apiKey_guard_1 = require("./apiKey.guard");
let BillingController = class BillingController {
    usersService;
    plans = [
        {
            id: 'starter',
            name: 'Starter',
            monthlyPrice: 0,
            annualPrice: 0,
            features: ['1 campaign', 'Up to 100 leads', 'Basic analytics'],
            quotas: { campaigns: 1, leads: 100 },
            isTrial: false,
            metadata: {},
            archived: false,
        },
        {
            id: 'growth',
            name: 'Growth',
            monthlyPrice: 29,
            annualPrice: 290,
            features: ['10 campaigns', 'Up to 5,000 leads', 'Advanced analytics'],
            quotas: { campaigns: 10, leads: 5000 },
            isTrial: false,
            metadata: {},
            archived: false,
        },
        {
            id: 'scale',
            name: 'Scale',
            monthlyPrice: 99,
            annualPrice: 990,
            features: [
                'Unlimited campaigns',
                'Up to 50,000 leads',
                'Priority support',
            ],
            quotas: { campaigns: -1, leads: 50000 },
            isTrial: false,
            metadata: {},
            archived: false,
        },
    ];
    nextPlanId = 1;
    constructor(usersService) {
        this.usersService = usersService;
    }
    listPlans() {
        return this.plans.filter((plan) => !plan.archived);
    }
    createPlan(body) {
        if (!body?.name?.trim()) {
            throw new common_1.BadRequestException('Plan name is required');
        }
        const monthlyPrice = Number(body.monthlyPrice ?? 0);
        const plan = {
            id: `plan_${this.nextPlanId++}`,
            name: body.name.trim(),
            monthlyPrice,
            annualPrice: Number(body.annualPrice ?? monthlyPrice * 10),
            features: body.features || [],
            quotas: body.quotas || {},
            metadata: body.metadata || {},
            isTrial: false,
            archived: false,
        };
        this.plans.push(plan);
        return plan;
    }
    getPlan(id) {
        return this.findPlan(id);
    }
    updatePlan(id, body) {
        const plan = this.findPlan(id);
        if (body.name !== undefined)
            plan.name = body.name;
        if (body.monthlyPrice !== undefined) {
            plan.monthlyPrice = Number(body.monthlyPrice);
        }
        if (body.annualPrice !== undefined) {
            plan.annualPrice = Number(body.annualPrice);
        }
        if (body.features !== undefined)
            plan.features = body.features;
        if (body.quotas !== undefined)
            plan.quotas = body.quotas;
        if (body.metadata !== undefined)
            plan.metadata = body.metadata;
        return plan;
    }
    deletePlan(id) {
        const plan = this.findPlan(id);
        plan.archived = true;
        return { success: true, id: plan.id, archived: true };
    }
    getLegacyPlans() {
        return this.listPlans();
    }
    getAccessPassPlans() {
        return this.plans
            .filter((plan) => !plan.archived)
            .map((plan) => ({
            id: plan.id,
            name: plan.name,
            price: plan.monthlyPrice,
            currency: 'USD',
            durationDays: 30,
            features: plan.features,
            configuration: plan.quotas,
        }));
    }
    async getSubscription(userId) {
        const id = Number(userId);
        if (!Number.isFinite(id))
            throw new common_1.NotFoundException('User not found');
        const user = await this.usersService.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return {
            userId: user.id,
            planId: user.mcomMembershipTier || user.mcomMembershipLevel || 'starter',
            planName: user.mcomMembershipLevel || 'Starter',
            status: user.mcomMembershipStatus || 'active',
            canAccessHotspot: user.mcomCanAccessVcard,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
        };
    }
    findPlan(id) {
        const plan = this.plans.find((entry) => entry.id === id && !entry.archived);
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('v1/system/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "listPlans", null);
__decorate([
    (0, common_1.Post)('v1/system/plans'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Get)('v1/system/plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Patch)('v1/system/plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('v1/system/plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('v1/billing/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getLegacyPlans", null);
__decorate([
    (0, common_1.Get)('v1/access-passes/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAccessPassPlans", null);
__decorate([
    (0, common_1.Get)('v1/billing/subscriptions/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getSubscription", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(apiKey_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map