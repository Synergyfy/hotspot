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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview() {
        const [users, campaigns, leads, domains, events, recentUsers, recentCampaigns, recentLeads, eventSummary] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.campaign.count(),
            this.prisma.lead.count(),
            this.prisma.domain.count(),
            this.prisma.analyticsEvent.count(),
            this.prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, email: true, name: true, role: true, createdAt: true, mcomUserId: true },
            }),
            this.prisma.campaign.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    user: { select: { id: true, email: true, name: true } },
                    _count: { select: { hotspots: true, leads: true, analytics: true } },
                },
            }),
            this.prisma.lead.findMany({
                orderBy: { createdAt: 'desc' },
                take: 8,
                include: { campaign: { select: { id: true, name: true, userId: true } } },
            }),
            this.prisma.analyticsEvent.groupBy({
                by: ['eventType'],
                _count: { _all: true },
            }),
        ]);
        return {
            totals: { users, campaigns, leads, domains, events },
            eventSummary: eventSummary.map((e) => ({ eventType: e.eventType, count: e._count._all })),
            recentUsers,
            recentCampaigns,
            recentLeads,
        };
    }
    async getUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isOnboarded: true,
                createdAt: true,
                updatedAt: true,
                mcomUserId: true,
                mcomMembershipLevel: true,
                mcomMembershipStatus: true,
                mcomMembershipTier: true,
                companyName: true,
                _count: { select: { campaigns: true, domains: true } },
            },
        });
    }
    async updateUserRole(id, role) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, name: true, role: true },
        });
    }
    async getCampaigns() {
        return this.prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, email: true, name: true, role: true } },
                _count: { select: { hotspots: true, leads: true, analytics: true } },
            },
        });
    }
    async deleteCampaign(id) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id }, select: { id: true } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.prisma.hotspot.deleteMany({ where: { campaignId: id } });
        await this.prisma.analyticsEvent.deleteMany({ where: { campaignId: id } });
        await this.prisma.lead.deleteMany({ where: { campaignId: id } });
        return this.prisma.campaign.delete({ where: { id }, select: { id: true } });
    }
    async getLeads() {
        return this.prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: {
                campaign: {
                    select: { id: true, name: true, userId: true, user: { select: { email: true, name: true } } },
                },
            },
        });
    }
    async deleteLead(id) {
        const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return this.prisma.lead.delete({ where: { id }, select: { id: true } });
    }
    async getDomains() {
        return this.prisma.domain.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
    }
    async deleteDomain(id) {
        const domain = await this.prisma.domain.findUnique({ where: { id }, select: { id: true } });
        if (!domain)
            throw new common_1.NotFoundException('Domain not found');
        return this.prisma.domain.delete({ where: { id }, select: { id: true } });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map