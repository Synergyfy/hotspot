import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() body: any) {
    return this.leadsService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('userId') userId: number) {
    return this.leadsService.findAll(userId);
  }
}
