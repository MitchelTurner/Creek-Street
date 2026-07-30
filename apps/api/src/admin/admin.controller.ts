import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('ops')
@UseGuards(AuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class AdminController {
  constructor(private readonly adminDashboard: AdminDashboardService) {}

  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  getDashboard() {
    return this.adminDashboard.snapshot();
  }
}
