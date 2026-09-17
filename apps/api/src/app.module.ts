import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { LeadsModule } from './leads/leads.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DomainsModule } from './domains/domains.module';
import { PublicModule } from './public/public.module';
import { UploadsModule } from './uploads/uploads.module';
import { McomModule } from './mcom/mcom.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { User } from './entities/user.entity';
import { Campaign } from './entities/campaign.entity';
import { Hotspot } from './entities/hotspot.entity';
import { Lead } from './entities/lead.entity';
import { Domain } from './entities/domain.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get('POSTGRES_HOST', 'localhost');
        const port = config.get<number>('POSTGRES_PORT', 5432);
        const name = config.get('POSTGRES_NAME', 'postgres');
        const user = config.get('POSTGRES_USERNAME', 'hotspot');
        const password = config.get('POSTGRES_PASSWORD', '');

        return {
          type: 'postgres',
          host,
          port,
          username: user,
          password,
          database: name,
          entities: [User, Campaign, Hotspot, Lead, Domain, AnalyticsEvent],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CampaignsModule,
    LeadsModule,
    AnalyticsModule,
    DomainsModule,
    PublicModule,
    UploadsModule,
    McomModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
