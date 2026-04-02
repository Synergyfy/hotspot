import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Convert a frontend hotspot object → Prisma-compatible row */
function toDbHotspot(h: any) {
  const {
    // Strip DB-generated / relational fields that must NOT be passed on create
    id, campaignId, createdAt, updatedAt,
    // Strip nested action object → flatten below
    action,
    // Strip all UI-only fields → pack into config JSON
    currency, triggerType, iconName, iconColor, backgroundColor,
    pulseAnimation, roundness, formFields, redirectUrl,
    width, height, imageUrl, videoUrl, price, ctaText,
    description, radius, filters,
    // What remains: x, y, type, title — valid DB columns
    ...rest
  } = h;

  // Remove undefined values from config so JSON stays clean
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

/** Convert a Prisma hotspot row → frontend-expected shape */
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
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: any) {
    const { hotspots, ...campaignData } = data;
    const result = await this.prisma.campaign.create({
      data: {
        ...campaignData,
        userId,
        hotspots: {
          create: (hotspots || []).map(toDbHotspot),
        },
      },
      include: { hotspots: true },
    });
    return toFrontendCampaign(result);
  }

  async findAll(userId: number) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { userId },
      include: { hotspots: true },
    });
    return campaigns.map(toFrontendCampaign);
  }

  async findOne(id: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { hotspots: true },
    });
    return toFrontendCampaign(campaign);
  }

  async update(id: number, userId: number, data: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    const { hotspots = [], ...campaignData } = data;

    // Split: positive integer id = existing DB record; anything else = new
    const existingHotspots = hotspots.filter((h: any) => Number.isInteger(h.id) && h.id > 0);
    const newHotspots = hotspots.filter((h: any) => !(Number.isInteger(h.id) && h.id > 0));
    const incomingIds = existingHotspots.map((h: any) => h.id);

    // Delete hotspots that were removed in the editor
    await this.prisma.hotspot.deleteMany({
      where: { campaignId: id, id: { notIn: incomingIds } },
    });

    // Update each existing hotspot in-place
    await Promise.all(
      existingHotspots.map((h: any) => {
        const { id: hotspotId, ...hotspotData } = toDbHotspot({ ...h, id: h.id });
        return this.prisma.hotspot.update({
          where: { id: h.id },
          data: hotspotData,
        });
      }),
    );

    // Update campaign fields + create brand-new hotspots
    const result = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...campaignData,
        ...(newHotspots.length > 0 && {
          hotspots: {
            create: newHotspots.map(toDbHotspot),
          },
        }),
      },
      include: { hotspots: true },
    });
    return toFrontendCampaign(result);
  }

  async remove(id: number, userId: number) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    await this.prisma.hotspot.deleteMany({ where: { campaignId: id } });
    await this.prisma.analyticsEvent.deleteMany({ where: { campaignId: id } });
    await this.prisma.lead.deleteMany({ where: { campaignId: id } });

    return this.prisma.campaign.delete({ where: { id } });
  }
}
