import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DomainsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, name: string) {
    return this.prisma.domain.create({ data: { userId, name } });
  }

  async findAll(userId: number) {
    return this.prisma.domain.findMany({ where: { userId } });
  }

  async remove(id: number, userId: number) {
    return this.prisma.domain.delete({ where: { id, userId } });
  }

  async verify(id: number, userId: number) {
    return this.prisma.domain.update({
      where: { id, userId },
      data: { verified: true },
    });
  }
}
