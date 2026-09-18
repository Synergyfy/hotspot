import { Controller, Get, Param } from '@nestjs/common';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('public')
export class PublicController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get('campaigns/:id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(+id);
  }
}
