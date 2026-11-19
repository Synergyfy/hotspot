import { DomainsService } from './domains.service';
export declare class DomainsController {
    private readonly domainsService;
    constructor(domainsService: DomainsService);
    create(userId: number, name: string): Promise<import("../entities/domain.entity").Domain>;
    findAll(userId: number): Promise<import("../entities/domain.entity").Domain[]>;
    remove(id: string, userId: number): Promise<import("../entities/domain.entity").Domain | null>;
    verify(id: string, userId: number): Promise<import("../entities/domain.entity").Domain | null>;
}
