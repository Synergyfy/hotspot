import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [CampaignsModule],
  controllers: [PublicController],
})
export class PublicModule {}
