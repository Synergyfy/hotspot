import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('leads')
@Unique(['campaignId', 'email'])
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campaignId: number;

  @ManyToOne(() => Campaign, (campaign) => campaign.leads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
