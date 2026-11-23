import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getOverview(): Promise<{
        totals: {
            users: number;
            campaigns: number;
            leads: number;
            domains: number;
            events: number;
        };
        eventSummary: {
            eventType: string;
            count: number;
        }[];
        recentUsers: {
            id: number;
            email: string;
            mcomUserId: string | null;
            name: string | null;
            createdAt: Date;
            role: string;
        }[];
        recentCampaigns: ({
            user: {
                id: number;
                email: string;
                name: string | null;
            };
            _count: {
                hotspots: number;
                analytics: number;
                leads: number;
            };
        } & {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            imageUrl: string;
            watermarkUrl: string | null;
            soundUrl: string | null;
            filters: import("@prisma/client/runtime/library").JsonValue | null;
            userId: number;
        })[];
        recentLeads: ({
            campaign: {
                id: number;
                name: string;
                userId: number;
            };
        } & {
            id: number;
            email: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            campaignId: number;
            ip: string | null;
        })[];
    }>;
    getUsers(): Promise<{
        id: number;
        email: string;
        mcomUserId: string | null;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        isOnboarded: boolean;
        mcomMembershipLevel: string | null;
        mcomMembershipStatus: string | null;
        mcomMembershipTier: string | null;
        role: string;
        companyName: string | null;
        _count: {
            campaigns: number;
            domains: number;
        };
    }[]>;
    updateUserRole(id: number, role: string): Promise<{
        id: number;
        email: string;
        name: string | null;
        role: string;
    }>;
    getCampaigns(): Promise<({
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
        };
        _count: {
            hotspots: number;
            analytics: number;
            leads: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        watermarkUrl: string | null;
        soundUrl: string | null;
        filters: import("@prisma/client/runtime/library").JsonValue | null;
        userId: number;
    })[]>;
    deleteCampaign(id: number): Promise<{
        id: number;
    }>;
    getLeads(): Promise<({
        campaign: {
            user: {
                email: string;
                name: string | null;
            };
            id: number;
            name: string;
            userId: number;
        };
    } & {
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        campaignId: number;
        ip: string | null;
    })[]>;
    deleteLead(id: number): Promise<{
        id: number;
    }>;
    getDomains(): Promise<({
        user: {
            id: number;
            email: string;
            name: string | null;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        verified: boolean;
    })[]>;
    deleteDomain(id: number): Promise<{
        id: number;
    }>;
}
