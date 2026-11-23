import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ApiKeyGuard } from './apiKey.guard';

interface PlanBody {
  name?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  features?: string[];
  quotas?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

interface Plan extends PlanBody {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  quotas: Record<string, number>;
  isTrial: boolean;
  metadata: Record<string, unknown>;
  archived: boolean;
}

@Controller()
@UseGuards(ApiKeyGuard)
export class BillingController {
  private readonly plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 0,
      annualPrice: 0,
      features: ['1 campaign', 'Up to 100 leads', 'Basic analytics'],
      quotas: { campaigns: 1, leads: 100 },
      isTrial: false,
      metadata: {},
      archived: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      monthlyPrice: 29,
      annualPrice: 290,
      features: ['10 campaigns', 'Up to 5,000 leads', 'Advanced analytics'],
      quotas: { campaigns: 10, leads: 5000 },
      isTrial: false,
      metadata: {},
      archived: false,
    },
    {
      id: 'scale',
      name: 'Scale',
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        'Unlimited campaigns',
        'Up to 50,000 leads',
        'Priority support',
      ],
      quotas: { campaigns: -1, leads: 50000 },
      isTrial: false,
      metadata: {},
      archived: false,
    },
  ];

  private nextPlanId = 1;

  constructor(private readonly usersService: UsersService) {}

  @Get('v1/system/plans')
  listPlans() {
    return this.plans.filter((plan) => !plan.archived);
  }

  @Post('v1/system/plans')
  createPlan(@Body() body: PlanBody) {
    if (!body?.name?.trim()) {
      throw new BadRequestException('Plan name is required');
    }

    const monthlyPrice = Number(body.monthlyPrice ?? 0);
    const plan: Plan = {
      id: `plan_${this.nextPlanId++}`,
      name: body.name.trim(),
      monthlyPrice,
      annualPrice: Number(body.annualPrice ?? monthlyPrice * 10),
      features: body.features || [],
      quotas: body.quotas || {},
      metadata: body.metadata || {},
      isTrial: false,
      archived: false,
    };
    this.plans.push(plan);
    return plan;
  }

  @Get('v1/system/plans/:id')
  getPlan(@Param('id') id: string) {
    return this.findPlan(id);
  }

  @Patch('v1/system/plans/:id')
  updatePlan(@Param('id') id: string, @Body() body: PlanBody) {
    const plan = this.findPlan(id);
    if (body.name !== undefined) plan.name = body.name;
    if (body.monthlyPrice !== undefined) {
      plan.monthlyPrice = Number(body.monthlyPrice);
    }
    if (body.annualPrice !== undefined) {
      plan.annualPrice = Number(body.annualPrice);
    }
    if (body.features !== undefined) plan.features = body.features;
    if (body.quotas !== undefined) plan.quotas = body.quotas;
    if (body.metadata !== undefined) plan.metadata = body.metadata;
    return plan;
  }

  @Delete('v1/system/plans/:id')
  deletePlan(@Param('id') id: string) {
    const plan = this.findPlan(id);
    plan.archived = true;
    return { success: true, id: plan.id, archived: true };
  }

  @Get('v1/billing/plans')
  getLegacyPlans() {
    return this.listPlans();
  }

  @Get('v1/access-passes/plans')
  getAccessPassPlans() {
    return this.plans
      .filter((plan) => !plan.archived)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.monthlyPrice,
        currency: 'USD',
        durationDays: 30,
        features: plan.features,
        configuration: plan.quotas,
      }));
  }

  @Get('v1/billing/subscriptions/:userId')
  async getSubscription(@Param('userId') userId: string) {
    const id = Number(userId);
    if (!Number.isFinite(id)) throw new NotFoundException('User not found');

    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return {
      userId: user.id,
      planId: user.mcomMembershipTier || user.mcomMembershipLevel || 'starter',
      planName: user.mcomMembershipLevel || 'Starter',
      status: user.mcomMembershipStatus || 'active',
      canAccessHotspot: user.mcomCanAccessVcard,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  private findPlan(id: string): Plan {
    const plan = this.plans.find((entry) => entry.id === id && !entry.archived);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}
