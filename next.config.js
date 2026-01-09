const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/acheron' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/acheron' : '',
};

module.exports = nextConfig;