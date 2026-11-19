import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UsersService {
    private users;
    constructor(users: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    findByMcomUserId(mcomUserId: string): Promise<User | null>;
    updateMcomFields(userId: number, mcomData: Partial<{
        mcomUserId: string;
        mcomMembershipLevel: string;
        mcomMembershipTier: string;
        mcomMembershipStatus: string;
        mcomCanAccessVcard: boolean;
        mcomAccessToken: string;
        mcomRefreshToken: string;
        mcomTokenExpiresAt: Date;
        mcomTokensUpdatedAt: Date;
    }>): Promise<User | null>;
    create(data: {
        email: string;
        password?: string;
        name?: string;
        role?: string;
    }): Promise<User>;
}
