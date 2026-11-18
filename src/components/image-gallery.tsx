"use client";

import { useState } from "react";

export default function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const fallback = "/images/car-placeholder.svg";
  const list = images.length > 0 ? images : [fallback];
  const [index, setIndex] = useState(0);
  const current = list[index] ?? fallback;

  return (
    <section className="vehicle-gallery" aria-label="Fotos do veículo">
      <div className="vehicle-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={title} />
        <span className="vehicle-gallery-counter">{index + 1} / {list.length}</span>
      </div>

      <div className="vehicle-gallery-thumbs">
        {list.map((img, i) => (
          <button
            key={`${img}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ver foto ${i + 1}`}
            aria-pressed={index === i}
            className={index === i ? "is-active" : ""}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" />
          </button>
        ))}
      </div>
    </section>
  );
}
