import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Domain } from './domain.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: 'agent' })
  role: string;

  @Column({ default: false })
  isOnboarded: boolean;

  // MCOM fields
  @Column({ nullable: true })
  mcomUserId: string;

  @Column({ nullable: true })
  mcomMembershipLevel: string;

  @Column({ nullable: true })
  mcomMembershipTier: string;

  @Column({ nullable: true })
  mcomMembershipStatus: string;

  @Column({ default: false })
  mcomCanAccessVcard: boolean;

  @Column({ type: 'text', nullable: true })
  mcomAccessToken: string;

  @Column({ type: 'text', nullable: true })
  mcomRefreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  mcomTokenExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  mcomTokensUpdatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Campaign, (campaign) => campaign.user)
  campaigns: Campaign[];

  @OneToMany(() => Domain, (domain) => domain.user)
  domains: Domain[];
}
