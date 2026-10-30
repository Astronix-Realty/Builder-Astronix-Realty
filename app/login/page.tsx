import type { Metadata } from 'next';
import LoginView from '@/components/auth/LoginView';

export const metadata: Metadata = {
  title: 'Builder & Mandate Portal Login | Astronix Realty',
  description: 'Sign in to the official Astronix Realty Developer & Mandate Portal. Access real-time buyer lead pipelines, tower inventory management, and marketing distribution across Mumbai MMR.',
  alternates: {
    canonical: 'https://builder.astronixrealty.com/login',
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
    title: 'Builder & Mandate Portal Login | Astronix Realty',
    description: 'Sign in to manage real estate projects, towers, inventory, and qualified buyer leads on the Astronix Realty partner network.',
    url: 'https://builder.astronixrealty.com/login',
    siteName: 'Astronix Realty Builder Network',
    images: [
      {
        url: 'https://builder.astronixrealty.com/og-image.jpg',
        secureUrl: 'https://builder.astronixrealty.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Astronix Realty Builder Portal Login',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Builder & Mandate Portal Login | Astronix Realty',
    description: 'Sign in to manage real estate projects, towers, inventory, and qualified buyer leads on the Astronix Realty partner network.',
    images: ['https://builder.astronixrealty.com/og-image.jpg'],
  },
};

export default function LoginPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://builder.astronixrealty.com/login#webapp',
        name: 'Astronix Realty Partner Portal Login',
        url: 'https://builder.astronixrealty.com/login',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        description: 'Secure authentication gateway for real estate builders, developers, and exclusive sales mandates.',
        provider: {
          '@type': 'Organization',
          name: 'Astronix Realty',
          legalName: 'Astronix Realty Private Limited',
          url: 'https://astronixrealty.com',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://builder.astronixrealty.com/login#breadcrumb',
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
            name: 'Partner Login',
            item: 'https://builder.astronixrealty.com/login',
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
      <LoginView />
    </>
  );
}
