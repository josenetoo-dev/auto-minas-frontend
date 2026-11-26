"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  videoSrc: string;
  posterSrc: string;
  title: string;
};

export default function HomeHoverVideo({ videoSrc, posterSrc, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      const frame = window.requestAnimationFrame(() => setBlocked(true));
      return () => window.cancelAnimationFrame(frame);
    }
    void video.play().catch(() => setBlocked(true));
  }, []);

  return (
    <div className="home-hover-video">
      <video
        ref={videoRef}
        className="home-hover-video-media"
        src={videoSrc}
        poster={posterSrc}
        preload="auto"
        muted
        autoPlay
        playsInline
        loop
        aria-label={title}
        onError={() => setError(true)}
        onPlaying={() => setBlocked(false)}
      />
      <div className="home-hover-video-shade" aria-hidden="true" />
      <div className="home-hover-video-overlay">
        <span className="home-hover-video-eyebrow">AUTO MINAS · EXPERIÊNCIA</span>
        <h3>{title}</h3>
        {error && <p role="status">Prévia indisponível no momento.</p>}
        {!error && blocked && <button type="button" className="mt-3 rounded-lg border border-white/60 bg-black/70 px-4 py-2 text-sm text-white" onClick={() => {
          void videoRef.current?.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
        }}>Reproduzir vídeo</button>}
      </div>
    </div>
  );
}
