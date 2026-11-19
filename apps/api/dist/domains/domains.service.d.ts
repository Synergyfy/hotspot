import { Repository } from 'typeorm';
import { Domain } from '../entities/domain.entity';
export declare class DomainsService {
    private domains;
    constructor(domains: Repository<Domain>);
    create(userId: number, name: string): Promise<Domain>;
    findAll(userId: number): Promise<Domain[]>;
    remove(id: number, userId: number): Promise<Domain | null>;
    verify(id: number, userId: number): Promise<Domain | null>;
}
