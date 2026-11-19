import { useEffect, useRef } from 'react';
import { getVideoEmbedUrl } from '../../lib/media';

interface HotspotVideoProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/** Plays a video from a YouTube or Vimeo link, a direct video link, or an uploaded file. */
export function HotspotVideo({ url, className = '', autoPlay = false, muted = false, controls = true }: HotspotVideoProps) {
  const embedUrl = getVideoEmbedUrl(url, { autoPlay, muted });
  const videoRef = useRef<HTMLVideoElement>(null);

  // The autoplay attribute alone is sometimes ignored when the element is
  // mounted after a click (for example when a modal opens). Asking for
  // playback explicitly, right after the user gesture, makes it reliable.
  useEffect(() => {
    if (!autoPlay || embedUrl) return;
    const el = videoRef.current;
    if (!el) return;
    el.play().catch(() => {
      // Browsers may still block sound; the controls let the visitor start it.
    });
  }, [url, autoPlay, embedUrl]);

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title="Video"
        className={`border-0 ${className}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={url}
      className={`object-cover ${className}`}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
    />
  );
}
