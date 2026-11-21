"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  videoSrc: string;
  posterSrc: string;
  title: string;
};

export default function HomeHoverVideo({ videoSrc, posterSrc, title }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35);
    }, { threshold: [0, 0.35, 0.65] });
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!visible || error) {
      video.pause();
      return;
    }
    video.muted = true;
    const attempt = video.play();
    if (attempt) void attempt.catch(() => {
      // Some browsers block autoplay despite muted inline playback.
      // Preserve the poster rather than requiring a tap.
    });
    return () => video.pause();
  }, [visible, error]);

  return (
    <div ref={shellRef} className="home-hover-video">
      <video
        ref={videoRef}
        className="home-hover-video-media"
        src={videoSrc}
        poster={posterSrc}
        preload="none"
        muted
        autoPlay={visible}
        playsInline
        loop
        aria-label={title}
        onError={() => setError(true)}
      />
      <div className="home-hover-video-shade" aria-hidden="true" />
      <div className="home-hover-video-overlay">
        <span className="home-hover-video-eyebrow">AUTO MINAS · EXPERIÊNCIA</span>
        <h3>{title}</h3>
        {error && <p role="status">Prévia indisponível no momento.</p>}
      </div>
    </div>
  );
}
