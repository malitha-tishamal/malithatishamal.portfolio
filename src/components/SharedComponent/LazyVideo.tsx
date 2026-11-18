"use client";

import { useEffect, useRef } from "react";

type LazyVideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
};

/**
 * Autoplaying preview clip that only starts once the card is visible and
 * pauses when it scrolls out. `preload="none"` means off-screen cards never
 * download the video at all (the originals are multi-megabyte). Users who ask
 * for reduced motion keep the poster frame.
 */
export const LazyVideo = ({ src, poster, className, style, ...rest }: LazyVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {
            /* autoplay may be blocked; the poster stays visible */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      className={className}
      style={style}
      {...rest}
    />
  );
};

export default LazyVideo;
