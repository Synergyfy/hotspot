import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { Hotspot } from '../entities/hotspot.entity';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Lead } from '../entities/lead.entity';

/** Convert a frontend hotspot object → DB-compatible row */
function toDbHotspot(h: any) {
  const {
    id, campaignId, createdAt, updatedAt,
    action,
    currency, triggerType, iconName, iconColor, backgroundColor,
    pulseAnimation, roundness, formFields, redirectUrl,
    width, height, imageUrl, videoUrl, price, ctaText,
    description, radius, filters,
    ...rest
  } = h;

  const config: Record<string, any> = {};
  const configSource = {
    currency, triggerType, iconName, iconColor, backgroundColor,
    pulseAnimation, roundness, formFields, redirectUrl,
    imageUrl, videoUrl, price, ctaText, description, radius,
    width, height, filters,
  };
  for (const [k, v] of Object.entries(configSource)) {
    if (v !== undefined) config[k] = v;
  }

  return {
    ...rest,
    actionType: action?.type ?? 'url',
    actionValue: action?.value ?? '',
    config,
  };
}

/** Convert a DB hotspot row → frontend-expected shape */
function toFrontendHotspot(h: any) {
  const { actionType, actionValue, config, ...rest } = h;
  return {
    ...rest,
    ...(config || {}),
    action: { type: actionType, value: actionValue },
  };
}

/** Map all hotspots in a campaign to the frontend shape */
function toFrontendCampaign(campaign: any) {
  if (!campaign) return campaign;
  return {
    ...campaign,
    hotspots: (campaign.hotspots || []).map(toFrontendHotspot),
  };
}

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaigns: Repository<Campaign>,
    @InjectRepository(Hotspot)
    private hotspots: Repository<Hotspot>,
    @InjectRepository(AnalyticsEvent)
    private analyticsEvents: Repository<AnalyticsEvent>,
    @InjectRepository(Lead)
    private leads: Repository<Lead>,
  ) {}

  async create(userId: number, data: any) {
    const { hotspots: hotspotData, ...campaignData } = data;
    const campaign = this.campaigns.create({ ...campaignData, userId });
    const { identifiers } = await this.campaigns.insert(campaign);
    const savedId = identifiers[0].id as number;

    if (hotspotData?.length) {
      const hotspotEntities = hotspotData.map((h: any) =>
        this.hotspots.create({ ...toDbHotspot(h), campaignId: savedId }),
      );
      await this.hotspots.save(hotspotEntities);
    }

    return this.findOne(savedId);
  }

  async findAll(userId: number) {
    const campaigns = await this.campaigns.find({
      where: { userId },
      relations: { hotspots: true },
    });
    return campaigns.map(toFrontendCampaign);
  }

  async findOne(id: number, userId?: number) {
    const campaign = await this.campaigns.findOne({
      where: { id },
      relations: { hotspots: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (userId !== undefined && campaign.userId !== userId) {
      throw new NotFoundException('Campaign not found');
    }
    return toFrontendCampaign(campaign);
  }

  async update(id: number, userId: number, data: any) {
    const campaign = await this.campaigns.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    const { hotspots: hotspotData = [], ...campaignData } = data;

    const existingHotspots = hotspotData.filter((h: any) => Number.isInteger(h.id) && h.id > 0);
    const newHotspots = hotspotData.filter((h: any) => !(Number.isInteger(h.id) && h.id > 0));
    const incomingIds = existingHotspots.map((h: any) => h.id);

    // Delete removed hotspots
    await this.hotspots
      .createQueryBuilder()
      .delete()
      .where('campaignId = :campaignId AND id NOT IN (:...ids)', {
        campaignId: id,
        ids: incomingIds.length ? incomingIds : [0],
      })
      .execute();

    // Update existing hotspots
    await Promise.all(
      existingHotspots.map((h: any) => {
        const { id: hotspotId, ...hotspotData } = toDbHotspot({ ...h, id: h.id });
        return this.hotspots.update(h.id, hotspotData);
      }),
    );

    // Create new hotspots
    if (newHotspots.length > 0) {
      const entities = newHotspots.map((h: any) =>
        this.hotspots.create({ ...toDbHotspot(h), campaignId: id }),
      );
      await this.hotspots.save(entities);
    }

    // Update campaign
    await this.campaigns.update(id, campaignData);

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const campaign = await this.campaigns.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    await this.hotspots.delete({ campaignId: id });
    await this.analyticsEvents.delete({ campaignId: id });
    await this.leads.delete({ campaignId: id });
    await this.campaigns.delete(id);
  }
}
