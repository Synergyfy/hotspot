import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from '../entities/lead.entity';
import { Campaign } from '../entities/campaign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Campaign])],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
