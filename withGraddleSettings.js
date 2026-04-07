const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withGradleSettings(config) {
  return withGradleProperties(config, (config) => {
    
    // 1. Add your RAM / Memory setting
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m', // Adjust 4096m (4GB) to whatever you used
    });

    // 2. Add any other Gradle settings you had (Examples below)
    // config.modResults.push({
    //   type: 'property',
    //   key: 'android.enableJetifier',
    //   value: 'true',
    // });

    return config;
  });
};