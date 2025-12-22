// File: client/craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1. Polyfill the missing Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "fs": false,
        "path": false,
        "os": false,
        "util": require.resolve("util/")
      };

      // 2. Inject the 'process' variable globally
      // FIX: We added '.js' to the end of the path below
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser.js', 
        }),
      ];

      return webpackConfig;
    }
  }
};