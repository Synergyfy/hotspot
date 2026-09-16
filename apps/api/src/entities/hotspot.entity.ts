import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('hotspots')
export class Hotspot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campaignId: number;

  @ManyToOne(() => Campaign, (campaign) => campaign.hotspots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  type: string;

  @Column('float')
  x: number;

  @Column('float')
  y: number;

  @Column('float', { nullable: true })
  width: number;

  @Column('float', { nullable: true })
  height: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  price: string;

  @Column({ nullable: true })
  ctaText: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  redirectUrl: string;

  @Column()
  actionType: string;

  @Column()
  actionValue: string;

  @Column({ type: 'jsonb', nullable: true })
  config: any;

  @Column({ type: 'jsonb', nullable: true })
  filters: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
