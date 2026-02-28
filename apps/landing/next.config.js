/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@apphouse/ui', '@apphouse/supabase-client', '@apphouse/utils'],
};

module.exports = nextConfig;
