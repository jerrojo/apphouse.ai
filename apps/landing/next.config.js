/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@apphouse/ui', '@apphouse/supabase-client', '@apphouse/utils'],

  // Subdomain rewrites — backup for middleware subdomain detection
  // Routes appname.apphouse.ai → /_app/appname internally
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<slug>[a-z0-9-]+)\\.apphouse\\.ai',
            },
          ],
          destination: '/_app/:slug/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

module.exports = nextConfig;
