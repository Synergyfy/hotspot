import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Hotspot } from './hotspot.entity';
import { Lead } from './lead.entity';
import { AnalyticsEvent } from './analytics-event.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.campaigns)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  watermarkUrl: string;

  @Column({ nullable: true })
  soundUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: any;

  @OneToMany(() => Hotspot, (hotspot) => hotspot.campaign, { cascade: true })
  hotspots: Hotspot[];

  @OneToMany(() => Lead, (lead) => lead.campaign)
  leads: Lead[];

  @OneToMany(() => AnalyticsEvent, (event) => event.campaign)
  analytics: AnalyticsEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
