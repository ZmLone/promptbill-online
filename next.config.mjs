/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Last-Modified',
            value: 'Wed, 25 Nov 2026 08:50:00 GMT',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
