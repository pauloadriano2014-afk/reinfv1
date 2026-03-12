/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ATENÇÃO: Isso ignora erros de TypeScript no build (útil para MVPs)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Isso ignora avisos de linting no build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;