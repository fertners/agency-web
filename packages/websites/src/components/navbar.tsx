import type { RestaurantWebsiteConfig } from '@ai-web-agency/shared';

export function Navbar({
  config,
}: Readonly<{ config: RestaurantWebsiteConfig }>) {
  return (
    <header className="awa-navbar">
      <div className="awa-container awa-navbar-inner">
        <a
          className="awa-brand"
          href="#top"
          aria-label={`${config.business.name}, accueil`}
        >
          {config.business.name}
        </a>
        <nav className="awa-nav-links" aria-label="Navigation principale">
          <a href="#about">À propos</a>
          {config.sections.includes('SPECIALTIES') ? (
            <a href="#specialties">La carte</a>
          ) : null}
          <a
            href={
              config.sections.includes('CONTACT') ? '#contact' : '#location'
            }
          >
            {config.sections.includes('CONTACT') ? 'Contact' : 'Adresse'}
          </a>
        </nav>
        <a
          className="awa-button awa-button-small"
          href={config.sections.includes('CONTACT') ? '#contact' : '#location'}
        >
          {config.content.primaryCallToAction}
        </a>
      </div>
    </header>
  );
}
