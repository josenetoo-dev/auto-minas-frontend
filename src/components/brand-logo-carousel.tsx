import Link from "next/link";

const brandColumns = [
  ["Toyota", "Honda", "Hyundai"],
  ["Volkswagen", "Chevrolet", "Fiat"],
  ["Jeep", "Renault", "Nissan"],
] as const;

export default function BrandLogoCarousel() {
  return (
    <div className="am-logo-carousel" aria-label="Encontre carros pela marca">
      <div className="am-logo-carousel-copy">
        <span className="am-logo-carousel-kicker">EXPLORE POR MARCA</span>
        <h3>Encontre seu próximo veículo pela marca.</h3>
        <p>Selecione uma marca para pesquisar anúncios. As marcas exibidas não representam parceiros comerciais.</p>
        <Link href="/carros" className="am-logo-carousel-cta">Ver todos os veículos <span aria-hidden="true">→</span></Link>
      </div>
      <div className="am-logo-carousel-columns">
        {brandColumns.map((column, columnIndex) => (
          <div className="am-logo-carousel-window" key={columnIndex}>
            <div className={`am-logo-carousel-track am-logo-carousel-track-${columnIndex + 1}`}>
              {[0, 1].map((copy) => (
                <div key={copy} className="am-logo-carousel-stack" aria-hidden={copy === 1}>
                  {column.map((brand) => (
                    <Link
                      href={`/carros?q=${encodeURIComponent(brand)}`}
                      className="am-logo-carousel-tile"
                      key={brand}
                      tabIndex={copy === 1 ? -1 : undefined}
                      aria-label={`Buscar veículos da marca ${brand}`}
                    >
                      <span className="am-logo-carousel-mark" aria-hidden="true">{brand.slice(0, 2).toUpperCase()}</span>
                      <strong>{brand}</strong>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
