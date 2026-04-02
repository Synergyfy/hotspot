import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser('userId') userId: number, @Body() body: any) {
    return this.campaignsService.create(userId, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('userId') userId: number) {
    return this.campaignsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @GetUser('userId') userId: number, @Body() body: any) {
    return this.campaignsService.update(+id, userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.campaignsService.remove(+id, userId);
  }
}
