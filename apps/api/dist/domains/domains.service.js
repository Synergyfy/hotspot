"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const domain_entity_1 = require("../entities/domain.entity");
let DomainsService = class DomainsService {
    domains;
    constructor(domains) {
        this.domains = domains;
    }
    async create(userId, name) {
        const domain = this.domains.create({ userId, name });
        return this.domains.save(domain);
    }
    async findAll(userId) {
        return this.domains.find({ where: { userId } });
    }
    async remove(id, userId) {
        const domain = await this.domains.findOne({ where: { id, userId } });
        if (!domain)
            return null;
        return this.domains.remove(domain);
    }
    async verify(id, userId) {
        await this.domains.update({ id, userId }, { verified: true });
        return this.domains.findOne({ where: { id } });
    }
};
exports.DomainsService = DomainsService;
exports.DomainsService = DomainsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DomainsService);
//# sourceMappingURL=domains.service.js.map