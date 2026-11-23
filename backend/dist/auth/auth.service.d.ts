import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(data: any): Promise<{
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
        };
        token: string;
    }>;
    login(email: string, pass: string): Promise<{
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
        };
        token: string;
    }>;
    adminLogin(email: string, password: string): Promise<{
        user: {
            id: number;
            email: string;
            name: string;
            role: string;
        };
        token: string;
    }>;
}
