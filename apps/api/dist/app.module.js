"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const leads_module_1 = require("./leads/leads.module");
const analytics_module_1 = require("./analytics/analytics.module");
const domains_module_1 = require("./domains/domains.module");
const public_module_1 = require("./public/public.module");
const uploads_module_1 = require("./uploads/uploads.module");
const mcom_module_1 = require("./mcom/mcom.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const user_entity_1 = require("./entities/user.entity");
const campaign_entity_1 = require("./entities/campaign.entity");
const hotspot_entity_1 = require("./entities/hotspot.entity");
const lead_entity_1 = require("./entities/lead.entity");
const domain_entity_1 = require("./entities/domain.entity");
const analytics_event_entity_1 = require("./entities/analytics-event.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const host = config.get('POSTGRES_HOST', 'localhost');
                    const port = config.get('POSTGRES_PORT', 5432);
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
                        entities: [user_entity_1.User, campaign_entity_1.Campaign, hotspot_entity_1.Hotspot, lead_entity_1.Lead, domain_entity_1.Domain, analytics_event_entity_1.AnalyticsEvent],
                        synchronize: true,
                    };
                },
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            campaigns_module_1.CampaignsModule,
            leads_module_1.LeadsModule,
            analytics_module_1.AnalyticsModule,
            domains_module_1.DomainsModule,
            public_module_1.PublicModule,
            uploads_module_1.UploadsModule,
            mcom_module_1.McomModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map