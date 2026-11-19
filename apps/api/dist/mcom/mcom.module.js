"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McomModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mcom_service_1 = require("./mcom.service");
const sso_controller_1 = require("./sso.controller");
const handshake_controller_1 = require("./handshake.controller");
const webhook_controller_1 = require("./webhook.controller");
const users_module_1 = require("../users/users.module");
let McomModule = class McomModule {
};
exports.McomModule = McomModule;
exports.McomModule = McomModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_ACCESS_SECRET') || configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_ACCESS_EXPIRATION') || '24h',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
        ],
        controllers: [sso_controller_1.SsoController, handshake_controller_1.HandshakeController, webhook_controller_1.WebhookController],
        providers: [mcom_service_1.McomService],
        exports: [mcom_service_1.McomService],
    })
], McomModule);
//# sourceMappingURL=mcom.module.js.map