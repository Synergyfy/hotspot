import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async logEvent(campaignId: number, data: any) {
    return this.prisma.analyticsEvent.create({
      data: {
        campaignId,
        ...data,
      },
    });
  }

  async getStats(campaignId: number, userId: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    const [summary, events, leads] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: { campaignId },
        _count: true,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { campaignId },
        orderBy: { timestamp: 'asc' },
        take: 500,
      }),
      this.prisma.lead.count({ where: { campaignId } }),
    ]);

    // `events` holds the raw recent events (used for the trend chart and domain
    // breakdown), while `summary` holds the grouped totals.
    return { summary, events, leads };
  }
}
