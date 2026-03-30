import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser('userId') userId: number, @Body('name') name: string) {
    return this.domainsService.create(userId, name);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('userId') userId: number) {
    return this.domainsService.findAll(userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.domainsService.remove(+id, userId);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  verify(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.domainsService.verify(+id, userId);
  }
}
