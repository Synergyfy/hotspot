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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const analytics_event_entity_1 = require("../entities/analytics-event.entity");
const campaign_entity_1 = require("../entities/campaign.entity");
const lead_entity_1 = require("../entities/lead.entity");
let AnalyticsService = class AnalyticsService {
    analyticsEvents;
    campaigns;
    leads;
    constructor(analyticsEvents, campaigns, leads) {
        this.analyticsEvents = analyticsEvents;
        this.campaigns = campaigns;
        this.leads = leads;
    }
    async logEvent(campaignId, data) {
        const campaign = await this.campaigns.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const event = this.analyticsEvents.create({ campaignId, ...data });
        return this.analyticsEvents.save(event);
    }
    async getStats(campaignId, userId) {
        const campaign = await this.campaigns.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.userId !== userId)
            throw new common_1.NotFoundException('Campaign not found');
        const [events, aggregated, leadsCount] = await Promise.all([
            this.analyticsEvents.find({
                where: { campaignId },
                order: { timestamp: 'DESC' },
            }),
            this.analyticsEvents
                .createQueryBuilder('event')
                .select('event.eventType', 'eventType')
                .addSelect('COUNT(*)', 'count')
                .where('event.campaignId = :campaignId', { campaignId })
                .groupBy('event.eventType')
                .getRawMany(),
            this.leads.count({ where: { campaignId } }),
        ]);
        return { events, aggregated, leads: leadsCount };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(analytics_event_entity_1.AnalyticsEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(2, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map