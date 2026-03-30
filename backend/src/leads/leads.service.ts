import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.lead.create({ data });
  }

  async findAll(userId: number) {
    return this.prisma.lead.findMany({
      where: {
        campaign: { userId },
      },
      include: { campaign: true },
    });
  }

  async remove(id: number) {
    return this.prisma.lead.delete({
      where: { id },
    });
  }
}
