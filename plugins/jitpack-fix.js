module.exports = function withJitpackFix(config) {
  return {
    ...config,
    android: {
      ...config.android,
      gradleProperties: {
        ...config.android?.gradleProperties,
      },
      extraProguardRules: config.android?.extraProguardRules,
    },
    mods: {
      android: {
        projectGradle: async (config, { modResults }) => {
          modResults.contents = modResults.contents.replace(
            /allprojects\s*{[\s\S]*?repositories\s*{[\s\S]*?google\(\)/,
            `allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
        maven { url 'https://jitpack-mirror.vercel.app' }
        maven { url 'https://www.jitpackm.io/api' }
        maven { url 'https://raw.githubusercontent.com/jitpack/jitpack.github.io/master' }`
          )
          return config
        },
      },
    },
  }
}
