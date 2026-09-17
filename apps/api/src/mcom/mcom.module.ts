import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { McomService } from './mcom.service';
import { SsoController } from './sso.controller';
import { HandshakeController } from './handshake.controller';
import { WebhookController } from './webhook.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION') || '24h',
        } as any,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [SsoController, HandshakeController, WebhookController],
  providers: [McomService],
  exports: [McomService],
})
export class McomModule {}