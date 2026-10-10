"use client";

import { useState } from "react";

export default function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const fallback = "/images/car-placeholder.svg";
  const list = images.length > 0 ? images : [fallback];
  const [current, setCurrent] = useState(list[0]);

  return (
    <div>
      <div className="card-dark relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-[#e8e8e2] backdrop-blur">
          {list.indexOf(current) + 1} / {list.length}
        </span>
      </div>
      {list.length > 1 && (
        <div className="nice-scroll mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setCurrent(img)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                current === img
                  ? "border-[#d4af37] shadow-[0_0_14px_rgba(212,175,55,0.35)]"
                  : "border-[#26262e] opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
