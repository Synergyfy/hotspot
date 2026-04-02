import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post(':campaignId/log')
  logEvent(@Param('campaignId') campaignId: string, @Body() body: any) {
    return this.analyticsService.logEvent(+campaignId, body);
  }

  @Get(':campaignId')
  @UseGuards(JwtAuthGuard)
  getStats(@Param('campaignId') campaignId: string) {
    return this.analyticsService.getStats(+campaignId);
  }
}
