import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = ['/admin', '/admin/', '/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Perplexity-User',
          'Claude-SearchBot',
          'Claude-User',
          'Googlebot',
          'Bingbot',
        ],
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'],
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: 'https://promptbill.online/sitemap.xml',
  };
}
