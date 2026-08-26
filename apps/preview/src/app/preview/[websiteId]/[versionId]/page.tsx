import { RestaurantTemplate } from '@ai-web-agency/websites';
import { createRestaurantJsonLd } from '@ai-web-agency/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getWebsiteVersion } from '@/lib/api';

export const dynamic = 'force-dynamic';

type PreviewPageProps = Readonly<{
  params: Promise<{ websiteId: string; versionId: string }>;
}>;

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { websiteId, versionId } = await params;
  const version = await getWebsiteVersion(websiteId, versionId);
  if (version === undefined) return { title: 'Preview introuvable' };

  return {
    title: version.config.content.seoTitle,
    description: version.config.content.seoDescription,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `https://preview.invalid/${version.config.business.slug}`,
    },
    openGraph: {
      title: version.config.content.seoTitle,
      description: version.config.content.seoDescription,
      type: 'website',
    },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { websiteId, versionId } = await params;
  const version = await getWebsiteVersion(websiteId, versionId);
  if (version === undefined) notFound();

  const canonicalUrl = `https://preview.invalid/${version.config.business.slug}`;
  const jsonLd = createRestaurantJsonLd(version.config, canonicalUrl);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <RestaurantTemplate config={version.config} />
    </>
  );
}
