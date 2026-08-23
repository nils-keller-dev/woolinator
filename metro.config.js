const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const config = getDefaultConfig(__dirname)

config.watchFolders = [path.resolve(__dirname, 'apps/pdf-viewer')]
config.resolver.enableGlobalPackages = true

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
})
