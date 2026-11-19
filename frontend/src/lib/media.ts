export const MAX_IMAGE_MB = 2;
export const MAX_VIDEO_MB = 10;
/** Main image plus extra photos on a product hotspot. */
export const MAX_PRODUCT_IMAGES = 3;

export type MediaKind = 'image' | 'video' | 'sound';

const MEDIA_RULES: Record<MediaKind, { mime: string; maxMb: number; wrongType: string; tooLarge: string }> = {
  image: {
    mime: 'image/',
    maxMb: MAX_IMAGE_MB,
    wrongType: 'That file is not an image. Choose a PNG, JPG or WebP file.',
    tooLarge: `That image is larger than ${MAX_IMAGE_MB} MB. Compress it and try again.`,
  },
  video: {
    mime: 'video/',
    maxMb: MAX_VIDEO_MB,
    wrongType: 'That file is not a video. Choose an MP4 or WebM file.',
    tooLarge: `That video is larger than ${MAX_VIDEO_MB} MB. Paste a video link instead, or compress the file.`,
  },
  sound: {
    mime: 'audio/',
    maxMb: MAX_VIDEO_MB,
    wrongType: 'That file is not a sound. Choose an MP3 or WAV file.',
    tooLarge: `That sound is larger than ${MAX_VIDEO_MB} MB. Choose a shorter clip.`,
  },
};

/** A message to show the user when the file cannot be uploaded, or null when it is fine. */
export function validateMediaFile(file: File, kind: MediaKind): string | null {
  const rule = MEDIA_RULES[kind];
  if (!file.type.startsWith(rule.mime)) return rule.wrongType;
  if (file.size > rule.maxMb * 1024 * 1024) return rule.tooLarge;
  return null;
}

export function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Player URL for a YouTube or Vimeo link, or null when the link points straight at a video file. */
export function getVideoEmbedUrl(url: string, { autoPlay = false, muted = false } = {}): string | null {
  if (!isHttpUrl(url)) return null;
  const { hostname, pathname, searchParams } = new URL(url);
  const host = hostname.replace(/^(www|m)\./, '');
  const flag = (on: boolean) => (on ? 1 : 0);

  let youtubeId: string | null | undefined;
  if (host === 'youtu.be') {
    youtubeId = pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    youtubeId = pathname === '/watch' ? searchParams.get('v') : pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  }
  if (youtubeId && /^[\w-]+$/.test(youtubeId)) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=${flag(autoPlay)}&mute=${flag(muted)}&playsinline=1`;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const vimeoId = pathname.match(/\/(\d+)/)?.[1];
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=${flag(autoPlay)}&muted=${flag(muted)}`;
  }

  return null;
}
