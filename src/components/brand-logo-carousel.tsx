"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const brands = [
  ["Toyota","toyota"],["Volkswagen","volkswagen"],["Chevrolet","chevrolet"],
  ["Fiat","fiat"],["Honda","honda"],["Hyundai","hyundai"],["Jeep","jeep"],
  ["Renault","renault"],["Nissan","nissan"],["Ford","ford"],["BMW","bmw"],["Audi","audi"],
  ["BYD","byd"],["Citroën","citroen"],["GWM","great-wall"],["Kia","kia"],
  ["Mercedes-Benz","mercedes-benz"],["Mitsubishi","mitsubishi"],["Peugeot","peugeot"],["Volvo","volvo"]
] as const;
const count = brands.length;
const wrap = (n: number) => ((n % count) + count) % count;

export default function BrandLogoCarousel() {
  const router = useRouter();
  const [position,setPosition] = useState(0);
  const [drag,setDrag] = useState(0);
  const pointer = useRef<{id:number; x:number; y:number; width:number; delta:number; swiping:boolean} | null>(null);
  const suppressClick = useRef(false);
  const [dragging,setDragging] = useState(false);
  const selected = wrap(position);
  const brand = brands[selected];

  function move(n:number) { setPosition(old => wrap(old+n)); }
  function start(e:PointerEvent<HTMLDivElement>) {
    if(e.button!==0 || pointer.current) return;
    pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY,width:e.currentTarget.clientWidth,delta:0,swiping:false};
  }
  function onMove(e:PointerEvent<HTMLDivElement>) {
    const p=pointer.current;
    if(!p || p.id!==e.pointerId) return;
    const dx=e.clientX-p.x;
    if(!p.swiping) {
      if(Math.abs(dx)<9 && Math.abs(e.clientY-p.y)<9) return;
      if(Math.abs(e.clientY-p.y)>Math.abs(dx)) { pointer.current=null; return; }
      p.swiping=true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    p.delta=Math.max(-1.2,Math.min(1.2,dx/Math.max(70,p.width*(p.width<600?.33:.21))));
    setDragging(true);
    setDrag(p.delta);
  }
  function finish(e:PointerEvent<HTMLDivElement>,cancel=false) {
    const p=pointer.current;
    if(!p || p.id!==e.pointerId) return;
    pointer.current=null;
    if(p.swiping) {
      suppressClick.current=true;
      window.setTimeout(()=>{suppressClick.current=false;},0);
    }
    if(!cancel && p.swiping && Math.abs(p.delta)>.16) move(p.delta<0?1:-1);
    setDrag(0);setDragging(false);
  }

  return (
    <div className="am-brand-3d" role="region" aria-label="Carrossel de marcas" onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1);}}}>
      <p className="am-brand-3d-hint"><span className="am-brand-desktop-hint">Arraste para explorar e escolha a marca do seu próximo carro.</span><span className="am-brand-mobile-hint"><svg viewBox="0 0 64 44" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 8H3m0 0 6-6M3 8l6 6M49 8h12m0 0-6-6m6 6-6 6"/><path d="m27 28-6-20c-1-5 6-7 7-2l4 14c1-5 7-5 8 0 3-4 8-2 8 2 4-2 8 1 8 6 0 10-7 14-15 14-5 0-9-2-13-6l-8-7c-3-4 2-8 7-1Z"/></svg>Deslize para explorar as marcas</span></p>
      <div className={`am-brand-3d-stage ${dragging?"is-dragging":""}`} onPointerDown={start} onPointerMove={onMove} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)}>
        {brands.map(([name,slug],i)=>{
          const offset=((i-selected+count+count/2)%count)-count/2;
          const d=offset+drag;
          const distance=Math.abs(d);
          return <button key={slug} type="button" className={`am-brand-3d-card ${offset===0?"is-active":""}`} data-offset={Math.abs(offset)} tabIndex={Math.abs(offset)<=2?0:-1} aria-label={`${offset===0?"Ver veículos da marca":"Selecionar"} ${name}`} aria-hidden={Math.abs(offset)>2} onClick={()=>{if(suppressClick.current || dragging)return; if(offset===0)router.push(`/carros?brand=${encodeURIComponent(name)}`); else setPosition(i)}} style={{"--offset":d,"--depth":distance,"--turn":`${-Math.max(-2,Math.min(2,d))*13}deg`,"--scale":Math.max(.68,1-distance*.10),zIndex:10-Math.round(distance*2)} as CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/brands/${slug}-logo.${["chevrolet","ford","honda","great-wall"].includes(slug)?"png":"svg"}`} alt="" draggable={false} loading="lazy"/>
            <span>{name}</span>
          </button>;
        })}
      </div>
      <div className="am-brand-active-name" aria-live="polite">{brand[0]}</div>
      <div className="am-brand-3d-controls">
        <button type="button" onClick={()=>move(-1)} aria-label="Marca anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 5-7 7 7 7"/></svg></button>
        <Link className="am-brand-cta" href={`/carros?brand=${encodeURIComponent(brand[0])}`}>Ver veículos <span aria-hidden="true">→</span></Link>
        <button type="button" onClick={()=>move(1)} aria-label="Próxima marca"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m9 5 7 7-7 7"/></svg></button>
      </div>
    </div>
  );
}
