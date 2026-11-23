import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { McomService } from './mcom.service';
import { SsoController } from './sso.controller';
import { HandshakeController } from './handshake.controller';
import { MeshController } from './mesh.controller';

type ExpiresIn = NonNullable<
  NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
>;

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRATION') ||
            '7d') as ExpiresIn,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SsoController, HandshakeController, MeshController],
  providers: [McomService],
  exports: [McomService],
})
export class McomModule {}
