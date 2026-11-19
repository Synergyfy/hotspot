import { Campaign } from './campaign.entity';
import { Domain } from './domain.entity';
export declare class User {
    id: number;
    email: string;
    password: string;
    name: string;
    role: string;
    isOnboarded: boolean;
    mcomUserId: string;
    mcomMembershipLevel: string;
    mcomMembershipTier: string;
    mcomMembershipStatus: string;
    mcomCanAccessVcard: boolean;
    mcomAccessToken: string;
    mcomRefreshToken: string;
    mcomTokenExpiresAt: Date;
    mcomTokensUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    campaigns: Campaign[];
    domains: Domain[];
}
