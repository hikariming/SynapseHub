import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  speedInsights: {
    enabled: true,
  },
  analytics: {
    enabled: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.textlingo.app',
        pathname: '/avatars/**',
      },
    ],
  }

  // 其他 Next.js 配置...
};

export default withNextIntl(nextConfig);
