import { UsersService } from '../users/users.service';
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
export declare class BillingController {
    private readonly usersService;
    private readonly plans;
    private nextPlanId;
    constructor(usersService: UsersService);
    listPlans(): Plan[];
    createPlan(body: PlanBody): Plan;
    getPlan(id: string): Plan;
    updatePlan(id: string, body: PlanBody): Plan;
    deletePlan(id: string): {
        success: boolean;
        id: string;
        archived: boolean;
    };
    getLegacyPlans(): Plan[];
    getAccessPassPlans(): {
        id: string;
        name: string;
        price: number;
        currency: string;
        durationDays: number;
        features: string[];
        configuration: Record<string, number>;
    }[];
    getSubscription(userId: string): Promise<{
        userId: number;
        planId: string;
        planName: string;
        status: string;
        canAccessHotspot: boolean;
        currentPeriodEnd: null;
        cancelAtPeriodEnd: boolean;
    }>;
    private findPlan;
}
export {};
