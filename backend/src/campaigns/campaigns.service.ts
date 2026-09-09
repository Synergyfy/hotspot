import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** UI-only fields carried on a hotspot that must be persisted inside `config` JSON, never as DB columns. */
const UI_ONLY_HOTSPOT_FIELDS = [
  'currency', 'triggerType', 'iconName', 'iconColor', 'backgroundColor',
  'pulseAnimation', 'animationType', 'roundness', 'formFields', 'redirectUrl',
  'imageUrl', 'videoUrl', 'price', 'ctaText', 'description', 'radius',
  'width', 'height', 'filters', 'offerType', 'additionalImages',
  'productInfo', 'icon',
] as const;

/** Convert a frontend hotspot object → Prisma-compatible row */
function toDbHotspot(h: any) {
  const {
    // Strip DB-generated / relational fields that must NOT be passed on create
    id, campaignId, createdAt, updatedAt,
    // Strip nested action object → flatten below
    action,
    // Strip all UI-only fields → pack into config JSON
    ...rest
  } = h;

  // Pack every recognized UI-only field into config so it round-trips through
  // toFrontendHotspot, and never leaks into the Prisma write as an unknown field.
  const config: Record<string, any> = {};
  for (const key of UI_ONLY_HOTSPOT_FIELDS) {
    if (h[key] !== undefined) config[key] = h[key];
  }

  // Only ever persist the real Hotspot DB columns. Unknown/UI fields that were
  // not explicitly recognized above are deliberately dropped instead of being
  // passed to Prisma (which would throw "unknown argument" → 500).
  return {
    type: rest.type,
    x: rest.x,
    y: rest.y,
    width: rest.width ?? null,
    height: rest.height ?? null,
    title: rest.title,
    description: config.description ?? null,
    price: config.price ?? null,
    ctaText: config.ctaText ?? null,
    imageUrl: config.imageUrl ?? null,
    videoUrl: config.videoUrl ?? null,
    redirectUrl: config.redirectUrl ?? null,
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

  async findLight(userId: number) {
    return this.prisma.campaign.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
  }

  async findOne(id: number, userId?: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { hotspots: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (userId !== undefined && campaign.userId !== userId) {
      throw new NotFoundException('Campaign not found');
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

    // Run all hotspot mutations inside a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete hotspots that were removed in the editor
      await tx.hotspot.deleteMany({
        where: { campaignId: id, id: { notIn: incomingIds } },
      });

      // Update each existing hotspot in-place
      await Promise.all(
        existingHotspots.map((h: any) =>
          tx.hotspot.update({
            where: { id: h.id },
            data: toDbHotspot(h),
          }),
        ),
      );

      // Update campaign fields + create brand-new hotspots
      return tx.campaign.update({
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
    });

    return toFrontendCampaign(result);
  }

  async remove(id: number, userId: number) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenException('Unauthorized');

    await this.prisma.$transaction([
      this.prisma.hotspot.deleteMany({ where: { campaignId: id } }),
      this.prisma.analyticsEvent.deleteMany({ where: { campaignId: id } }),
      this.prisma.lead.deleteMany({ where: { campaignId: id } }),
      this.prisma.campaign.delete({ where: { id } }),
    ]);
  }
}
