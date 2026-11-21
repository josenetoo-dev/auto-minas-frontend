"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  videoSrc: string;
  posterSrc: string;
  title: string;
};

export default function HomeHoverVideo({ videoSrc, posterSrc, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setActive(false);
  }, []);

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !inView || error) return;
    try {
      video.muted = true;
      await video.play();
      setActive(true);
    } catch {
      setActive(false);
    }
  }, [error, inView]);

  useEffect(() => {
    const target = shellRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) {
        videoRef.current?.pause();
        setActive(false);
      }
    }, { rootMargin: "120px", threshold: 0.1 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={shellRef}
      className="home-hover-video"
      onMouseEnter={() => { void play(); }}
      onMouseLeave={pause}
    >
      <video
        ref={videoRef}
        className="home-hover-video-media"
        poster={posterSrc}
        preload={inView ? "metadata" : "none"}
        src={inView && !error ? videoSrc : undefined}
        muted
        playsInline
        loop
        aria-label={title}
        onLoadedData={() => setLoaded(true)}
        onError={() => { setError(true); setActive(false); }}
      />
      <div className="home-hover-video-shade" aria-hidden="true" />
      <div className="home-hover-video-overlay">
        <span className="home-hover-video-eyebrow">AUTO MINAS · EXPERIÊNCIA</span>
        <h3>{title}</h3>
        <p>{error ? "A prévia está temporariamente indisponível." : active ? "Reproduzindo prévia" : "Passe o mouse ou toque para assistir"}</p>
        <button
          className="home-hover-video-toggle"
          type="button"
          onClick={() => { if (active) pause(); else void play(); }}
          aria-label={active ? "Pausar vídeo" : "Reproduzir vídeo"}
          aria-pressed={active}
          disabled={error}
        >{active ? "Pausar" : "Assistir"} <span aria-hidden="true">{active ? "Ⅱ" : "▶"}</span></button>
        {!loaded && !error && <span className="home-hover-video-hint">Prévia ilustrativa</span>}
      </div>
    </div>
  );
}
