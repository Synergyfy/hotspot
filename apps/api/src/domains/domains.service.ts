import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from '../entities/domain.entity';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domains: Repository<Domain>,
  ) {}

  async create(userId: number, name: string) {
    const domain = this.domains.create({ userId, name });
    return this.domains.save(domain);
  }

  async findAll(userId: number) {
    return this.domains.find({ where: { userId } });
  }

  async remove(id: number, userId: number) {
    const domain = await this.domains.findOne({ where: { id, userId } });
    if (!domain) return null;
    return this.domains.remove(domain);
  }

  async verify(id: number, userId: number) {
    await this.domains.update({ id, userId }, { verified: true });
    return this.domains.findOne({ where: { id } });
  }
}
