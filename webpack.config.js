const createExpoWebpackConfigAsync = require("@expo/webpack-config")

module.exports = async (env, argv) => {
  const config = await createExpoWebpackConfigAsync(env, argv)

  // Add PWA support
  if (env.mode === "production") {
    const { GenerateSW } = require("workbox-webpack-plugin")

    config.plugins.push(
      new GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
      }),
    )
  }

  return config
}
