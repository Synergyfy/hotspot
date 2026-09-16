import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: data.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.lead.create({ data });
  }

  async findAll(userId: number, campaignId?: number) {
    const where: any = { campaign: { userId } };
    if (campaignId) {
      where.campaignId = campaignId;
    }

    return this.prisma.lead.findMany({
      where,
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number, userId: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { campaign: { select: { userId: true } } },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    return this.prisma.lead.delete({ where: { id } });
  }
}
