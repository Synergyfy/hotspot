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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lead_entity_1 = require("../entities/lead.entity");
const campaign_entity_1 = require("../entities/campaign.entity");
let LeadsService = class LeadsService {
    leads;
    campaigns;
    constructor(leads, campaigns) {
        this.leads = leads;
        this.campaigns = campaigns;
    }
    async create(data) {
        const campaign = await this.campaigns.findOne({ where: { id: data.campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const lead = this.leads.create(data);
        return this.leads.save(lead);
    }
    async findAll(userId, campaignId) {
        const qb = this.leads
            .createQueryBuilder('lead')
            .innerJoinAndSelect('lead.campaign', 'campaign')
            .where('campaign.userId = :userId', { userId })
            .orderBy('lead.createdAt', 'DESC');
        if (campaignId) {
            qb.andWhere('lead.campaignId = :campaignId', { campaignId });
        }
        const leads = await qb.getMany();
        return leads.map((l) => ({
            ...l,
            campaign: { id: l.campaign.id, name: l.campaign.name },
        }));
    }
    async remove(id, userId) {
        const lead = await this.leads.findOne({
            where: { id },
            relations: { campaign: true },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        if (lead.campaign.userId !== userId)
            throw new common_1.ForbiddenException('Unauthorized');
        return this.leads.remove(lead);
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LeadsService);
//# sourceMappingURL=leads.service.js.map