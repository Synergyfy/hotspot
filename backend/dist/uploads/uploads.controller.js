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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const multer_1 = require("multer");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const MB = 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * MB;
const MAX_VIDEO_BYTES = 10 * MB;
const ALLOWED_EXTENSIONS = {
    image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'],
    video: ['.mp4', '.webm', '.mov', '.m4v', '.ogv'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
};
function getMediaKind(file) {
    const kind = file.mimetype.split('/')[0];
    const extension = (0, path_1.extname)(file.originalname).toLowerCase();
    return ALLOWED_EXTENSIONS[kind]?.includes(extension) ? kind : null;
}
let UploadsController = class UploadsController {
    async uploadFile(file) {
        if (!file)
            throw new common_1.BadRequestException('No file was uploaded.');
        if (getMediaKind(file) === 'image' && file.size > MAX_IMAGE_BYTES) {
            await (0, promises_1.unlink)(file.path).catch(() => undefined);
            throw new common_1.BadRequestException('Images must be 2 MB or smaller.');
        }
        return {
            url: `/uploads/${file.filename}`,
        };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        limits: { fileSize: MAX_VIDEO_BYTES },
        fileFilter: (req, file, cb) => {
            if (getMediaKind(file))
                return cb(null, true);
            cb(new common_1.BadRequestException('That file type is not supported. Upload an image, video or audio file.'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadFile", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads')
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map