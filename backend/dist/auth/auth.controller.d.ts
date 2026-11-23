import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
        };
        token: string;
    }>;
    login(body: any): Promise<{
        user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
        };
        token: string;
    }>;
    adminLogin(body: any): Promise<{
        user: {
            id: number;
            email: string;
            name: string;
            role: string;
        };
        token: string;
    }>;
}
