import {
  restaurantWebsiteConfigSchema,
  type RestaurantWebsiteConfig,
} from '@ai-web-agency/shared';
import { renderToStaticMarkup } from 'react-dom/server';

import { RestaurantTemplate } from './restaurant-template.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderStaticRestaurantDocument(
  input: RestaurantWebsiteConfig,
  options: Readonly<{ canonicalUrl: string; stylesheet: string }>,
): string {
  const config = restaurantWebsiteConfigSchema.parse(input);
  const title = escapeHtml(config.content.seoTitle);
  const description = escapeHtml(config.content.seoDescription);
  const canonicalUrl = escapeHtml(options.canonicalUrl);
  const body = renderToStaticMarkup(<RestaurantTemplate config={config} />);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<style>${options.stylesheet}</style>
</head>
<body style="margin:0">${body}</body>
</html>`;
}
