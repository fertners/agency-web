import {
  restaurantWebsiteConfigSchema,
  type RestaurantSection,
  type RestaurantWebsiteConfig,
} from '@ai-web-agency/shared';
import type { CSSProperties, ReactNode } from 'react';

import { Hero } from './components/hero.js';
import { Navbar } from './components/navbar.js';
import { Section } from './components/section.js';

type ThemeStyle = CSSProperties & Record<`--awa-${string}`, string>;

const serviceLabels = {
  DINE_IN: 'Sur place',
  TAKEAWAY: 'À emporter',
  DELIVERY: 'Livraison',
  RESERVATIONS: 'Réservations',
  TERRACE: 'Terrasse',
  PRIVATE_EVENTS: 'Événements privés',
} as const;

function renderSection(
  section: RestaurantSection,
  config: RestaurantWebsiteConfig,
): ReactNode {
  const business = config.business;
  switch (section) {
    case 'NAVBAR':
      return <Navbar config={config} />;
    case 'HERO':
      return <Hero config={config} />;
    case 'ABOUT':
      return (
        <Section
          eyebrow="Notre histoire"
          title={business.tagline ?? 'Une table sincère'}
          className="awa-about"
        >
          <p className="awa-lead" id="about">
            {config.content.about}
          </p>
        </Section>
      );
    case 'SPECIALTIES':
      return business.menuHighlights.length === 0 ? null : (
        <Section
          eyebrow="La carte"
          title={config.content.specialtiesHeading}
          className="awa-alt"
        >
          <div className="awa-card-grid" id="specialties">
            {business.menuHighlights.map((item) => (
              <article className="awa-menu-card" key={item.name}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                {item.price === undefined ? null : (
                  <strong>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: item.currency,
                    }).format(item.price)}
                  </strong>
                )}
              </article>
            ))}
          </div>
        </Section>
      );
    case 'SERVICES':
      return business.services.length === 0 ? null : (
        <Section eyebrow="À votre service" title="Chaque détail compte">
          <ul className="awa-service-list">
            {business.services.map((service) => (
              <li key={service}>{serviceLabels[service]}</li>
            ))}
          </ul>
        </Section>
      );
    case 'GALLERY':
      return business.gallery.length === 0 ? null : (
        <Section eyebrow="L’univers" title="À table" className="awa-alt">
          <div className="awa-gallery">
            {business.gallery.map((image) => (
              <img
                key={image.url}
                src={image.url}
                alt={image.alt}
                loading="lazy"
              />
            ))}
          </div>
        </Section>
      );
    case 'REVIEWS':
      return business.reviews.length === 0 ? null : (
        <Section eyebrow="Vos mots" title="Ils parlent de nous">
          <div className="awa-review-grid">
            {business.reviews.map((review) => (
              <figure key={`${review.author}-${review.quote}`}>
                <blockquote>“{review.quote}”</blockquote>
                <figcaption>
                  {review.author} · {review.rating}/5
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      );
    case 'OPENING_HOURS':
      return business.openingHours.length === 0 ? null : (
        <Section
          eyebrow="Horaires"
          title="Quand nous retrouver"
          className="awa-alt"
        >
          <dl className="awa-hours">
            {business.openingHours.map((hours) => (
              <div key={hours.day}>
                <dt>{hours.day}</dt>
                <dd>
                  {hours.closed
                    ? 'Fermé'
                    : `${hours.opensAt} – ${hours.closesAt}`}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      );
    case 'LOCATION':
      return (
        <Section eyebrow="Bordeaux" title="Nous trouver">
          <address className="awa-lead">
            {business.address.street}
            <br />
            {business.address.postalCode} {business.address.city}
          </address>
        </Section>
      );
    case 'CONTACT':
      return (
        <Section
          eyebrow="Réservation"
          title="Votre table vous attend"
          className="awa-contact"
        >
          <div id="contact" className="awa-contact-links">
            {business.contact.phone === undefined ? null : (
              <a href={`tel:${business.contact.phone}`}>
                {business.contact.phone}
              </a>
            )}
            {business.contact.email === undefined ? null : (
              <a href={`mailto:${business.contact.email}`}>
                {business.contact.email}
              </a>
            )}
          </div>
        </Section>
      );
    case 'CTA':
      return (
        <section className="awa-cta">
          <div className="awa-container">
            <h2>{config.content.headline}</h2>
            <a className="awa-button" href="#contact">
              {config.content.primaryCallToAction}
            </a>
          </div>
        </section>
      );
    case 'FOOTER':
      return (
        <footer className="awa-footer">
          <div className="awa-container">
            <strong>{business.name}</strong>
            <span>
              {business.address.city} · {business.address.countryCode}
            </span>
          </div>
        </footer>
      );
  }
}

export function RestaurantTemplate({
  config: input,
}: Readonly<{ config: RestaurantWebsiteConfig }>) {
  const config = restaurantWebsiteConfigSchema.parse(input);
  const style: ThemeStyle = {
    '--awa-primary': config.design.primaryColor,
    '--awa-accent': config.design.accentColor,
    '--awa-background': config.design.backgroundColor,
    '--awa-text': config.design.textColor,
  };
  return (
    <main className="awa-site" style={style}>
      {config.sections.map((section) => (
        <div key={section}>{renderSection(section, config)}</div>
      ))}
    </main>
  );
}
