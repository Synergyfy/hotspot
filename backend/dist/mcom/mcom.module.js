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
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const users_module_1 = require("../users/users.module");
const mcom_service_1 = require("./mcom.service");
const sso_controller_1 = require("./sso.controller");
const handshake_controller_1 = require("./handshake.controller");
const mesh_controller_1 = require("./mesh.controller");
let McomModule = class McomModule {
};
exports.McomModule = McomModule;
exports.McomModule = McomModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'secret',
                    signOptions: {
                        expiresIn: (configService.get('JWT_ACCESS_EXPIRATION') ||
                            '7d'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [sso_controller_1.SsoController, handshake_controller_1.HandshakeController, mesh_controller_1.MeshController],
        providers: [mcom_service_1.McomService],
        exports: [mcom_service_1.McomService],
    })
], McomModule);
//# sourceMappingURL=mcom.module.js.map