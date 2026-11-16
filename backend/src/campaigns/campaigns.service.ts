import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Convert a frontend hotspot object → Prisma-compatible row.
 *
 * Only real database columns are returned. Everything the editor owns
 * (colours, animations, form fields, product info, media, sizes...) is
 * packed into the `config` JSON column so Prisma never sees unknown keys.
 */
function toDbHotspot(h: any) {
  const config: Record<string, any> = {};
  const configSource: Record<string, any> = {
    currency: h.currency,
    triggerType: h.triggerType,
    iconName: h.iconName,
    iconColor: h.iconColor,
    backgroundColor: h.backgroundColor,
    animationType: h.animationType,
    pulseAnimation: h.pulseAnimation,
    roundness: h.roundness,
    formFields: h.formFields,
    redirectUrl: h.redirectUrl,
    width: h.width,
    height: h.height,
    imageUrl: h.imageUrl,
    videoUrl: h.videoUrl,
    price: h.price,
    ctaText: h.ctaText,
    description: h.description,
    radius: h.radius,
    filters: h.filters,
    productInfo: h.productInfo,
    additionalImages: h.additionalImages,
    offerType: h.offerType,
  };

  for (const [key, value] of Object.entries(configSource)) {
    if (value !== undefined) config[key] = value;
  }

  return {
    x: Number(h.x) || 0,
    y: Number(h.y) || 0,
    type: h.type || 'standard',
    title: h.title || 'Hotspot',
    actionType: h.action?.type ?? 'url',
    actionValue: h.action?.value ?? '',
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

  async findOne(id: number, userId?: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { hotspots: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (userId !== undefined && campaign.userId !== userId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }
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
        const hotspotData = toDbHotspot(h);
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
