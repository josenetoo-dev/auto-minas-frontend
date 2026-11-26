import Link from "next/link";
import Image from "next/image";
import { featuredCars, recommendedHomeCars, type CarData } from "@/lib/car";
import { formatPrice } from "@/lib/format";
import HomeHoverVideo from "@/components/home-hover-video";
import BrandLogoCarousel from "@/components/brand-logo-carousel";

// Nunca manter anúncio suspenso no destaque por cache da página inicial.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const categories = [
  { label: "Carros", href: "/carros?tipo=CARRO", icon: "car" },
  { label: "Utilitários", href: "/carros?tipo=CARRO", icon: "utility" },
  { label: "Caminhões", href: "/carros?tipo=CARRO", icon: "truck" },
  { label: "Outros", href: "/carros", icon: "more" },
] as const;

function CategoryIcon({ type }: { type: (typeof categories)[number]["icon"] }) {
  if (type === "car") {
    return <><path d="M5 13l1.6-4.2A2 2 0 0 1 8.5 7.5h7a2 2 0 0 1 1.9 1.3L19 13"/><path d="M4 13h16v4H4z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/></>;
  }
  if (type === "utility") {
    return <><path d="M3 8h12v9H3zM15 11h3l3 3v3h-6z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></>;
  }
  if (type === "truck") {
    return <><path d="M3 7h10v10H3zM13 10h4l4 4v3h-8z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></>;
  }
  return <><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></>;
}

export default async function HomePage() {
  const recommendation = await recommendedHomeCars(6).catch(() => null);
  const fallback = recommendation?.organic.length ? null : await featuredCars(6).catch(() => null);
  const featured = recommendation?.organic.length ? recommendation.organic : fallback;
  const sponsored = recommendation?.sponsored ?? [];

  function cards(cars:CarData[], sponsoredSection=false) {
    return <div className="home-recommended-row">
      {cars.map((car) => {
        const photo = car.images[0] ?? "/images/car-placeholder.svg";
        return <Link href={`/carros/${car.id}`} key={car.id} className="home-reference-vehicle-card">
          <div className="home-reference-vehicle-media">
            <Image src={photo} alt={`${car.brand} ${car.model}`} fill
              sizes="(max-width: 767px) 55vw, 280px" quality={72} className="object-cover" />
            {car.isDemo ? <span className="home-published-badge">DEMO · Negociação simulada</span>
              : sponsoredSection ? <span className="home-published-badge">Patrocinado</span>
              : car.status === "ativo" ? <span className="home-published-badge">Publicado</span> : null}
          </div>
          <div className="home-reference-vehicle-info">
            <h3>{car.brand} {car.model} {car.year}</h3>
            <strong>{formatPrice(car.price)}</strong>
            <p>{car.city && car.state ? `${car.city} · ${car.state}` : "Localização não informada"}</p>
          </div>
        </Link>;
      })}
    </div>;
  }

  return (
    <div className="home-exact-screen">
      <section className="home-reference-hero">
        <Image
          src="/images/home/auto-minas-road.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={82}
          className="home-reference-road"
        />

        <div className="home-reference-hero-copy">
          <h1>
            Compre e venda<br />
            seu carro com<br />
            mais <span>segurança</span>
          </h1>
          <p>Veículos analisados, vendedores identificados e uma experiência pensada para você.</p>
          <div className="home-reference-actions">
            <Link href="/carros" className="home-primary-cta">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
              Buscar carros
            </Link>
            <Link href="/vender" className="home-secondary-cta">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              Anunciar veículo
            </Link>
          </div>
        </div>

      </section>

      <section className="home-trust-strip" aria-label="Diferenciais do Auto Minas">
        {[
          ["shield", "Anúncios", "analisados"],
          ["check", "Vendedores", "identificados"],
          ["handshake", "Negociação", "direta"],
          ["headset", "Suporte", "especializado"],
        ].map(([icon, line1, line2]) => (
          <div key={line1} className="home-trust-item">
            <span className="home-trust-icon" aria-hidden="true">
              {icon === "shield" && <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>}
              {icon === "check" && <svg viewBox="0 0 24 24"><path d="M12 3l2 2.2 3-.3.8 2.9 2.7 1.4-1 2.8 1 2.8-2.7 1.4-.8 2.9-3-.3L12 21l-2-2.2-3 .3-.8-2.9-2.7-1.4 1-2.8-1-2.8 2.7-1.4L7 4.9l3 .3L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>}
              {icon === "handshake" && <svg viewBox="0 0 24 24"><path d="M8 11 5 8 2 11l5 5 3-2M16 11l3-3 3 3-5 5-3-2"/><path d="m9 10 2-2h2l2 2-3 3-3-3Z"/></svg>}
              {icon === "headset" && <svg viewBox="0 0 24 24"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a1 1 0 0 1-1-1v-5ZM20 13h-3v6h2a1 1 0 0 0 1-1v-5ZM17 19c0 1.1-.9 2-2 2h-3"/></svg>}
            </span>
            <span>{line1}<br />{line2}</span>
          </div>
        ))}
      </section>

      <section className="home-reference-section">
        <div className="home-section-heading">
          <h2>Explore por categoria</h2>
          <Link href="/carros">Ver todas <span aria-hidden="true">›</span></Link>
        </div>
        <div className="home-category-row">
          {categories.map((category, index) => (
            <Link key={category.label} href={category.href} className={`home-category-card ${index === 0 ? "is-active" : ""}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><CategoryIcon type={category.icon} /></svg>
              <span>{category.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-reference-section">
        <div className="home-section-heading">
          <h2><span className="home-heading-icon" aria-hidden="true">◎</span> Veículos para você</h2>
          <Link href="/carros">Ver mais <span aria-hidden="true">›</span></Link>
        </div>

        {!featured && (
          <div className="home-empty-state">Não foi possível carregar os veículos agora.</div>
        )}

        {featured && featured.length === 0 && (
          <div className="home-empty-state">Novos veículos aparecerão aqui após a aprovação dos anúncios.</div>
        )}

        {featured && featured.length > 0 && cards(featured)}
      </section>

      {sponsored.length > 0 && <section className="home-reference-section" aria-label="Anúncios patrocinados">
        <div className="home-section-heading"><h2>Patrocinados</h2><Link href="/carros">Ver catálogo <span aria-hidden="true">›</span></Link></div>
        {cards(sponsored,true)}
      </section>}

      <section className="home-reference-section home-video-section" aria-label="Prévia em vídeo do Auto Minas">
        <div className="home-section-heading"><h2>Uma nova forma de encontrar seu próximo carro</h2></div>
        <p className="home-video-caption">O vídeo começa automaticamente quando você chega a esta seção.</p>
        <HomeHoverVideo
          title="Seu próximo caminho começa aqui."
          posterSrc="/images/vehicle-illustration.svg"
          videoSrc="https://videos.pexels.com/video-files/13594876/13594876-hd_1920_1080_24fps.mp4"
        />
      </section>

      <section className="home-reference-section home-brand-section">
        <div className="home-section-heading">
          <h2>Busque por <span>marca</span></h2>
          <Link href="/carros">Ver todas <span aria-hidden="true">›</span></Link>
        </div>
        <BrandLogoCarousel />
      </section>
    </div>
  );
}
