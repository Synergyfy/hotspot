import type { AuthenticatedServiceRequest } from './serviceAuthMiddleware';
export declare class MeshController {
    status(req: AuthenticatedServiceRequest): {
        ok: boolean;
        app: string | undefined;
        caller: string | undefined;
        delegated: boolean;
        scopes: string[];
    };
}
