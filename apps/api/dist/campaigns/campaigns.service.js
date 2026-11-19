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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("../entities/campaign.entity");
const hotspot_entity_1 = require("../entities/hotspot.entity");
const analytics_event_entity_1 = require("../entities/analytics-event.entity");
const lead_entity_1 = require("../entities/lead.entity");
function toDbHotspot(h) {
    const { id, campaignId, createdAt, updatedAt, action, currency, triggerType, iconName, iconColor, backgroundColor, pulseAnimation, roundness, formFields, redirectUrl, width, height, imageUrl, videoUrl, price, ctaText, description, radius, filters, ...rest } = h;
    const config = {};
    const configSource = {
        currency, triggerType, iconName, iconColor, backgroundColor,
        pulseAnimation, roundness, formFields, redirectUrl,
        imageUrl, videoUrl, price, ctaText, description, radius,
        width, height, filters,
    };
    for (const [k, v] of Object.entries(configSource)) {
        if (v !== undefined)
            config[k] = v;
    }
    return {
        ...rest,
        actionType: action?.type ?? 'url',
        actionValue: action?.value ?? '',
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
    campaigns;
    hotspots;
    analyticsEvents;
    leads;
    constructor(campaigns, hotspots, analyticsEvents, leads) {
        this.campaigns = campaigns;
        this.hotspots = hotspots;
        this.analyticsEvents = analyticsEvents;
        this.leads = leads;
    }
    async create(userId, data) {
        const { hotspots: hotspotData, ...campaignData } = data;
        const campaign = this.campaigns.create({ ...campaignData, userId });
        const { identifiers } = await this.campaigns.insert(campaign);
        const savedId = identifiers[0].id;
        if (hotspotData?.length) {
            const hotspotEntities = hotspotData.map((h) => this.hotspots.create({ ...toDbHotspot(h), campaignId: savedId }));
            await this.hotspots.save(hotspotEntities);
        }
        return this.findOne(savedId);
    }
    async findAll(userId) {
        const campaigns = await this.campaigns.find({
            where: { userId },
            relations: { hotspots: true },
        });
        return campaigns.map(toFrontendCampaign);
    }
    async findOne(id, userId) {
        const campaign = await this.campaigns.findOne({
            where: { id },
            relations: { hotspots: true },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (userId !== undefined && campaign.userId !== userId) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        return toFrontendCampaign(campaign);
    }
    async update(id, userId, data) {
        const campaign = await this.campaigns.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.userId !== userId)
            throw new common_1.ForbiddenException('Unauthorized');
        const { hotspots: hotspotData = [], ...campaignData } = data;
        const existingHotspots = hotspotData.filter((h) => Number.isInteger(h.id) && h.id > 0);
        const newHotspots = hotspotData.filter((h) => !(Number.isInteger(h.id) && h.id > 0));
        const incomingIds = existingHotspots.map((h) => h.id);
        await this.hotspots
            .createQueryBuilder()
            .delete()
            .where('campaignId = :campaignId AND id NOT IN (:...ids)', {
            campaignId: id,
            ids: incomingIds.length ? incomingIds : [0],
        })
            .execute();
        await Promise.all(existingHotspots.map((h) => {
            const { id: hotspotId, ...hotspotData } = toDbHotspot({ ...h, id: h.id });
            return this.hotspots.update(h.id, hotspotData);
        }));
        if (newHotspots.length > 0) {
            const entities = newHotspots.map((h) => this.hotspots.create({ ...toDbHotspot(h), campaignId: id }));
            await this.hotspots.save(entities);
        }
        await this.campaigns.update(id, campaignData);
        return this.findOne(id);
    }
    async remove(id, userId) {
        const campaign = await this.campaigns.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.userId !== userId)
            throw new common_1.ForbiddenException('Unauthorized');
        await this.hotspots.delete({ campaignId: id });
        await this.analyticsEvents.delete({ campaignId: id });
        await this.leads.delete({ campaignId: id });
        await this.campaigns.delete(id);
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(hotspot_entity_1.Hotspot)),
    __param(2, (0, typeorm_1.InjectRepository)(analytics_event_entity_1.AnalyticsEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map