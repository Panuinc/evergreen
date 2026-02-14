/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@heroui/react"],
  experimental: {
    optimizePackageImports: ["@heroui/react", "lucide-react"],
  },
};

export default nextConfig;
