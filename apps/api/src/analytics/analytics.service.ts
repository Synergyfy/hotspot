import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Campaign } from '../entities/campaign.entity';
import { Lead } from '../entities/lead.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsEvents: Repository<AnalyticsEvent>,
    @InjectRepository(Campaign)
    private campaigns: Repository<Campaign>,
    @InjectRepository(Lead)
    private leads: Repository<Lead>,
  ) {}

  async logEvent(campaignId: number, data: any) {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const event = this.analyticsEvents.create({ campaignId, ...data });
    return this.analyticsEvents.save(event);
  }

  async getStats(campaignId: number, userId: number) {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new NotFoundException('Campaign not found');

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
}
