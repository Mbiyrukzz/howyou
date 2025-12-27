// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Add support for .cjs files (required by LiveKit)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs']

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'es-abstract': require.resolve('es-abstract'),
  'es-abstract/2023/PromiseResolve': require.resolve('es-abstract'),
  'es-abstract/2023/Type': require.resolve('es-abstract'),
  'es-abstract/2023/RequireObjectCoercible': require.resolve('es-abstract'),
  'es-abstract/2023/Get': require.resolve('es-abstract'),
  'es-abstract/2023/Call': require.resolve('es-abstract'),
}

module.exports = config
