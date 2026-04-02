import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    create(userId: number, body: any): Promise<any>;
    findAll(userId: number): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, userId: number, body: any): Promise<any>;
    remove(id: string, userId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        filters: import("@prisma/client/runtime/library").JsonValue | null;
        userId: number;
        watermarkUrl: string | null;
        soundUrl: string | null;
    }>;
}
