import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://builder.astronixrealty.com';
  const currentDate = new Date().toISOString();

  return [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
    },
  ];
}
