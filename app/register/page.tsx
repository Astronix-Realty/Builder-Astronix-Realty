import type { Metadata } from 'next';
import RegisterView from '@/components/auth/RegisterView';

export const metadata: Metadata = {
  title: 'Register as Builder or Mandate Partner | Astronix Realty',
  description: 'Register your real estate development company or exclusive sales mandate agency with Astronix Realty. Access verified homebuyer demand, inventory control, and lead tracking across Mumbai MMR.',
  alternates: {
    canonical: 'https://builder.astronixrealty.com/register',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Register as Builder or Mandate Partner | Astronix Realty',
    description: 'Onboard as a RERA-registered builder or exclusive sales mandate on Astronix Realty. Zero duplicate listings, real base-rate clarity, and verified buyer leads.',
    url: 'https://builder.astronixrealty.com/register',
    siteName: 'Astronix Realty',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://builder.astronixrealty.com/og-image.png',
        secureUrl: 'https://builder.astronixrealty.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Register as Builder or Mandate Partner | Astronix Realty',
        type: 'image/png',
      },
      {
        url: 'https://builder.astronixrealty.com/og-image.jpg',
        secureUrl: 'https://builder.astronixrealty.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Register as Builder or Mandate Partner | Astronix Realty',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register as Builder or Mandate Partner | Astronix Realty',
    description: 'Onboard as a RERA-registered builder or exclusive sales mandate on Astronix Realty. Zero duplicate listings, real base-rate clarity, and verified buyer leads.',
    images: ['https://builder.astronixrealty.com/og-image.png'],
  },
};

export default function RegisterPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://builder.astronixrealty.com/register#webapp',
        name: 'Astronix Realty Partner Registration',
        url: 'https://builder.astronixrealty.com/register',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        description: 'Developer and mandate onboarding application for verified real estate inventory distribution and sales management.',
        provider: {
          '@type': 'Organization',
          name: 'Astronix Realty',
          legalName: 'Astronix Realty Private Limited',
          url: 'https://astronixrealty.com',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://builder.astronixrealty.com/register#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Partner Network',
            item: 'https://builder.astronixrealty.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Partner Registration',
            item: 'https://builder.astronixrealty.com/register',
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <RegisterView />
    </>
  );
}
