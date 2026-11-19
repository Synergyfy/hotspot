import { BadRequestException, Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { unlink } from 'fs/promises';

const MB = 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * MB;
const MAX_VIDEO_BYTES = 10 * MB;

type MediaKind = 'image' | 'video' | 'audio';

const ALLOWED_EXTENSIONS: Record<MediaKind, string[]> = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'],
  video: ['.mp4', '.webm', '.mov', '.m4v', '.ogv'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
};

/** The kind of media a file is, or null when its type or extension is not allowed. */
function getMediaKind(file: { mimetype: string; originalname: string }): MediaKind | null {
  const kind = file.mimetype.split('/')[0] as MediaKind;
  const extension = extname(file.originalname).toLowerCase();
  return ALLOWED_EXTENSIONS[kind]?.includes(extension) ? kind : null;
}

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: MAX_VIDEO_BYTES },
    fileFilter: (req, file, cb) => {
      if (getMediaKind(file)) return cb(null, true);
      cb(new BadRequestException('That file type is not supported. Upload an image, video or audio file.'), false);
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file was uploaded.');

    if (getMediaKind(file) === 'image' && file.size > MAX_IMAGE_BYTES) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Images must be 2 MB or smaller.');
    }

    return {
      url: `/uploads/${file.filename}`,
    };
  }
}
