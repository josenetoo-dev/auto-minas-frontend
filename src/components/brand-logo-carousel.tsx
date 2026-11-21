"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const brands = [
  {
    "name": "Toyota",
    "slug": "toyota"
  },
  {
    "name": "Volkswagen",
    "slug": "volkswagen"
  },
  {
    "name": "Chevrolet",
    "slug": "chevrolet"
  },
  {
    "name": "Fiat",
    "slug": "fiat"
  },
  {
    "name": "Honda",
    "slug": "honda"
  },
  {
    "name": "Hyundai",
    "slug": "hyundai"
  },
  {
    "name": "Jeep",
    "slug": "jeep"
  },
  {
    "name": "Renault",
    "slug": "renault"
  },
  {
    "name": "Nissan",
    "slug": "nissan"
  },
  {
    "name": "Ford",
    "slug": "ford"
  },
  {
    "name": "BMW",
    "slug": "bmw"
  },
  {
    "name": "Audi",
    "slug": "audi"
  }
] as const;

const step = 360 / brands.length;

export default function BrandLogoCarousel() {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<{ start: number; rotation: number; id: number } | null>(null);
  const selected = ((Math.round(-rotation / step) % brands.length) + brands.length) % brands.length;
  const brand = brands[selected];

  function move(direction: number) {
    setRotation(value => Math.round(value / step) * step - direction * step);
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || pointer.current) return;
    pointer.current = { start: event.clientX, rotation, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current?.id !== event.pointerId) return;
    setRotation(pointer.current.rotation + (event.clientX - pointer.current.start) * .32);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    setRotation(value => Math.round(value / step) * step);
  }

  return (
    <div className="am-brand-3d" role="region" aria-label="Carrossel 3D de marcas">
      <p className="am-brand-3d-hint">Arraste para girar e escolha a marca do seu próximo carro.</p>
      <div className="am-brand-3d-stage" onPointerDown={start} onPointerMove={drag} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
        <div className={`am-brand-3d-ring ${dragging ? "is-dragging" : ""}`} style={{ transform: `translateZ(calc(-1 * var(--brand-radius))) rotateY(${rotation}deg)` }}>
          {brands.map((item, index) => (
            <div key={item.slug} className="am-brand-3d-card" style={{ "--brand-angle": `${index * step}deg` } as CSSProperties} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://cdn.simpleicons.org/${item.slug}/171717`} alt="" draggable={false} loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="am-brand-3d-controls">
        <button type="button" onClick={() => move(-1)} aria-label="Marca anterior">‹</button>
        <div className="am-brand-3d-selection">
          <span aria-live="polite">{brand.name}</span>
          <Link href={`/carros?brand=${encodeURIComponent(brand.name)}`}>Ver veículos <span aria-hidden="true">→</span></Link>
        </div>
        <button type="button" onClick={() => move(1)} aria-label="Próxima marca">›</button>
      </div>
    </div>
  );
}
