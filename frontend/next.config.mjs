import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { isServer }) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    config.resolve.alias['@app'] = path.resolve(__dirname, 'src/app');
    return config;
  },
};

export default nextConfig;
