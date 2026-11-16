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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function toDbHotspot(h) {
    const config = {};
    const configSource = {
        currency: h.currency,
        triggerType: h.triggerType,
        iconName: h.iconName,
        iconColor: h.iconColor,
        backgroundColor: h.backgroundColor,
        animationType: h.animationType,
        pulseAnimation: h.pulseAnimation,
        roundness: h.roundness,
        formFields: h.formFields,
        redirectUrl: h.redirectUrl,
        width: h.width,
        height: h.height,
        imageUrl: h.imageUrl,
        videoUrl: h.videoUrl,
        price: h.price,
        ctaText: h.ctaText,
        description: h.description,
        radius: h.radius,
        filters: h.filters,
        productInfo: h.productInfo,
        additionalImages: h.additionalImages,
        offerType: h.offerType,
    };
    for (const [key, value] of Object.entries(configSource)) {
        if (value !== undefined)
            config[key] = value;
    }
    return {
        x: Number(h.x) || 0,
        y: Number(h.y) || 0,
        type: h.type || 'standard',
        title: h.title || 'Hotspot',
        actionType: h.action?.type ?? 'url',
        actionValue: h.action?.value ?? '',
        config,
    };
}
function toFrontendHotspot(h) {
    const { actionType, actionValue, config, ...rest } = h;
    return {
        ...rest,
        ...(config || {}),
        action: { type: actionType, value: actionValue },
    };
}
function toFrontendCampaign(campaign) {
    if (!campaign)
        return campaign;
    return {
        ...campaign,
        hotspots: (campaign.hotspots || []).map(toFrontendHotspot),
    };
}
let CampaignsService = class CampaignsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, data) {
        const { hotspots, ...campaignData } = data;
        const result = await this.prisma.campaign.create({
            data: {
                ...campaignData,
                userId,
                hotspots: {
                    create: (hotspots || []).map(toDbHotspot),
                },
            },
            include: { hotspots: true },
        });
        return toFrontendCampaign(result);
    }
    async findAll(userId) {
        const campaigns = await this.prisma.campaign.findMany({
            where: { userId },
            include: { hotspots: true },
        });
        return campaigns.map(toFrontendCampaign);
    }
    async findOne(id, userId) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: { hotspots: true },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (userId !== undefined && campaign.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this campaign');
        }
        return toFrontendCampaign(campaign);
    }
    async update(id, userId, data) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.userId !== userId)
            throw new common_1.ForbiddenException('Unauthorized');
        const { hotspots = [], ...campaignData } = data;
        const existingHotspots = hotspots.filter((h) => Number.isInteger(h.id) && h.id > 0);
        const newHotspots = hotspots.filter((h) => !(Number.isInteger(h.id) && h.id > 0));
        const incomingIds = existingHotspots.map((h) => h.id);
        await this.prisma.hotspot.deleteMany({
            where: { campaignId: id, id: { notIn: incomingIds } },
        });
        await Promise.all(existingHotspots.map((h) => {
            const hotspotData = toDbHotspot(h);
            return this.prisma.hotspot.update({
                where: { id: h.id },
                data: hotspotData,
            });
        }));
        const result = await this.prisma.campaign.update({
            where: { id },
            data: {
                ...campaignData,
                ...(newHotspots.length > 0 && {
                    hotspots: {
                        create: newHotspots.map(toDbHotspot),
                    },
                }),
            },
            include: { hotspots: true },
        });
        return toFrontendCampaign(result);
    }
    async remove(id, userId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.userId !== userId)
            throw new common_1.ForbiddenException('Unauthorized');
        await this.prisma.hotspot.deleteMany({ where: { campaignId: id } });
        await this.prisma.analyticsEvent.deleteMany({ where: { campaignId: id } });
        await this.prisma.lead.deleteMany({ where: { campaignId: id } });
        return this.prisma.campaign.delete({ where: { id } });
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map