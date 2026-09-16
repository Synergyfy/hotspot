import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Campaign } from '../entities/campaign.entity';
import { Lead } from '../entities/lead.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, Campaign, Lead])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
