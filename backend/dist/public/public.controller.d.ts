import { CampaignsService } from '../campaigns/campaigns.service';
export declare class PublicController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    findOne(id: string): Promise<any>;
}
