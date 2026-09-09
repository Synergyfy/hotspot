export const ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'ogg'];

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx + 1).toLowerCase();
}

/** Returns an error message string, or null if the file is valid. */
export function validateUploadFile(file: File): string | null {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
    return 'File type not supported. Allowed: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MP3, WAV, OGG.';
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return 'File is too large. Maximum size is 10MB.';
  }
  return null;
}