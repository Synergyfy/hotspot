import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async logEvent(campaignId: number, data: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.analyticsEvent.create({
      data: {
        campaignId,
        ...data,
      },
    });
  }

  async getStats(campaignId: number, userId: number) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new NotFoundException('Campaign not found');

    const [events, aggregated, leadsCount] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { campaignId },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: { campaignId },
        _count: true,
      }),
      this.prisma.lead.count({ where: { campaignId } }),
    ]);

    return { events, aggregated, leads: leadsCount };
  }
}
