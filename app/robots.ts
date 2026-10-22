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
      // General search engines (Google, Bing, Yahoo, etc.)
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/llms.txt', '/astronix-logo.png', '/favicon.ico'],
        disallow: privateRoutes,
      },
      // Googlebot
      {
        userAgent: 'Googlebot',
        allow: ['/', '/login', '/register', '/llms.txt', '/astronix-logo.png'],
        disallow: privateRoutes,
      },
      // OpenAI live search crawler (ChatGPT Search)
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/', '/login', '/register', '/llms.txt'],
        disallow: privateRoutes,
      },
      // Perplexity search crawler
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/login', '/register', '/llms.txt'],
        disallow: privateRoutes,
      },
      // Claude search integration
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/login', '/register', '/llms.txt'],
        disallow: privateRoutes,
      },
    ],
    sitemap: 'https://builder.astronixrealty.com/sitemap.xml',
    host: 'https://builder.astronixrealty.com',
  };
}
