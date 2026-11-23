import { Controller, Get, Req } from '@nestjs/common';
import type { AuthenticatedServiceRequest } from './serviceAuthMiddleware';

@Controller('v1/mesh')
export class MeshController {
  @Get('status')
  status(@Req() req: AuthenticatedServiceRequest) {
    const caller = req.serviceCaller;
    return {
      ok: true,
      app: process.env.MCOM_CLIENT_ID,
      caller: caller?.callerAppId,
      delegated: caller?.isDelegated || false,
      scopes: caller?.scopes || [],
    };
  }
}
