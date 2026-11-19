import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(data: any): Promise<{
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
            isOnboarded: boolean;
        };
        token: string;
    }>;
    login(email: string, pass: string): Promise<{
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
            isOnboarded: boolean;
        };
        token: string;
    }>;
}
