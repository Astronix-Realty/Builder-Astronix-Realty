import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const privateRoutes = [
    '/builder-dashboard/',
    '/mandate-dashboard/',
    '/team-panel/',
    '/panel/',
    '/property/',
    '/preview/',
    '/api/',
  ];

  return {
    rules: [
      // Social media preview crawlers (WhatsApp, Facebook, LinkedIn, Twitter, Telegram, Slack)
      {
        userAgent: [
          'facebookexternalhit',
          'Facebot',
          'WhatsApp',
          'Twitterbot',
          'LinkedInBot',
          'TelegramBot',
          'Slackbot',
          'Pinterestbot',
        ],
        allow: [
          '/',
          '/login',
          '/register',
          '/og-image.png',
          '/og-image.jpg',
          '/opengraph-image.png',
          '/twitter-image.png',
          '/astronix-logo.png',
          '/logo.png',
          '/favicon.ico',
          '/apple-icon.png',
        ],
        disallow: privateRoutes,
      },
      // General search engines (Google, Bing, Yahoo, etc.)
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/register',
          '/llms.txt',
          '/og-image.png',
          '/og-image.jpg',
          '/opengraph-image.png',
          '/twitter-image.png',
          '/astronix-logo.png',
          '/logo.png',
          '/favicon.ico',
          '/icon-192.png',
          '/icon-512.png',
          '/apple-icon.png',
        ],
        disallow: privateRoutes,
      },
      // Googlebot
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/login',
          '/register',
          '/llms.txt',
          '/og-image.png',
          '/og-image.jpg',
          '/astronix-logo.png',
        ],
        disallow: privateRoutes,
      },
    ],
    sitemap: 'https://builder.astronixrealty.com/sitemap.xml',
    host: 'https://builder.astronixrealty.com',
  };
}
