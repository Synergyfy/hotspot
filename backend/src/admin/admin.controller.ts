import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(+id, body.role);
  }

  @Get('campaigns')
  getCampaigns() {
    return this.adminService.getCampaigns();
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.adminService.deleteCampaign(+id);
  }

  @Get('leads')
  getLeads() {
    return this.adminService.getLeads();
  }

  @Delete('leads/:id')
  deleteLead(@Param('id') id: string) {
    return this.adminService.deleteLead(+id);
  }

  @Get('domains')
  getDomains() {
    return this.adminService.getDomains();
  }

  @Delete('domains/:id')
  deleteDomain(@Param('id') id: string) {
    return this.adminService.deleteDomain(+id);
  }
}
