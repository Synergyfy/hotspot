import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: number;
        email: string;
        password: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: number): Promise<{
        id: number;
        email: string;
        password: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(data: {
        email: string;
        password: string;
        name?: string;
    }): Promise<{
        id: number;
        email: string;
        password: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
