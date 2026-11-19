import { User } from './user.entity';
export declare class Domain {
    id: number;
    userId: number;
    user: User;
    name: string;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
