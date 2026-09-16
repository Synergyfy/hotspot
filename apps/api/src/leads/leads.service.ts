import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { Campaign } from '../entities/campaign.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leads: Repository<Lead>,
    @InjectRepository(Campaign)
    private campaigns: Repository<Campaign>,
  ) {}

  async create(data: any) {
    const campaign = await this.campaigns.findOne({ where: { id: data.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const lead = this.leads.create(data);
    return this.leads.save(lead);
  }

  async findAll(userId: number, campaignId?: number) {
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

  async remove(id: number, userId: number) {
    const lead = await this.leads.findOne({
      where: { id },
      relations: { campaign: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    return this.leads.remove(lead);
  }
}
