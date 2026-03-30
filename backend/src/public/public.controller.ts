import { Controller, Get, Param } from '@nestjs/common';
import { CampaignsService } from '../campaigns/campaigns.service';

@Controller('public')
export class PublicController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('campaigns/:id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(+id);
  }
}
