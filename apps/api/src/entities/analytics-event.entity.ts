import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campaignId: number;

  @ManyToOne(() => Campaign, (campaign) => campaign.analytics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  eventType: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  domain: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
