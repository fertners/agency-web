import type { RestaurantWebsiteConfig } from '@ai-web-agency/shared';

export function Hero({
  config,
}: Readonly<{ config: RestaurantWebsiteConfig }>) {
  const image = config.business.heroImage;
  return (
    <section id="top" className="awa-hero">
      {image === undefined ? (
        <div className="awa-hero-texture" />
      ) : (
        <img className="awa-hero-image" src={image.url} alt={image.alt} />
      )}
      <div className="awa-hero-overlay" />
      <div className="awa-container awa-hero-content">
        <span className="awa-hero-kicker" aria-hidden="true">
          {config.business.name.slice(0, 2).toLocaleUpperCase('fr-FR')}
        </span>
        {config.business.cuisines.length === 0 ? null : (
          <p className="awa-eyebrow">{config.business.cuisines.join(' · ')}</p>
        )}
        <h1>{config.content.headline}</h1>
        <p className="awa-hero-copy">{config.content.subheadline}</p>
        <a
          className="awa-button"
          href={config.sections.includes('CONTACT') ? '#contact' : '#location'}
        >
          {config.content.primaryCallToAction}
        </a>
      </div>
      <p className="awa-hero-scroll" aria-hidden="true">
        Découvrir <span>↓</span>
      </p>
    </section>
  );
}
