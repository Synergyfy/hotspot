import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { Campaign } from '../entities/campaign.entity';
import { Hotspot } from '../entities/hotspot.entity';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Lead } from '../entities/lead.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Hotspot, AnalyticsEvent, Lead]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
