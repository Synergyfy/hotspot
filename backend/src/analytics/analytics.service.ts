import { Injectable } from '@nestjs/common';
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

  async getStats(campaignId: number) {
    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { campaignId },
      _count: true,
    });

    const leadsCount = await this.prisma.lead.count({
      where: { campaignId },
    });

    return { events, leads: leadsCount };
  }
}
