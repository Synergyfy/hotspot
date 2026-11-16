import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.lead.create({ data });
  }

  async findAll(userId: number, campaignId?: number) {
    return this.prisma.lead.findMany({
      where: {
        campaign: { userId },
        ...(campaignId ? { campaignId } : {}),
      },
      include: { campaign: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number, userId: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { campaign: { select: { userId: true } } },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.campaign.userId !== userId) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    return this.prisma.lead.delete({ where: { id } });
  }
}
