import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    create(userId: number, body: any): Promise<any>;
    findAll(userId: number): Promise<any[]>;
    findLight(userId: number): Promise<{
        name: string;
        id: number;
    }[]>;
    findOne(id: string, userId: number): Promise<any>;
    update(id: string, userId: number, body: any): Promise<any>;
    remove(id: string, userId: number): Promise<void>;
}
