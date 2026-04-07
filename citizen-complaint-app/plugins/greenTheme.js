const { withAndroidStyles, withInfoPlist } = require('@expo/config-plugins');

function withAndroidGreenTheme(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const appTheme = styles.resources.style.find(
      (s) => s.$.name === 'AppTheme'
    );
    if (appTheme) {
      appTheme.item = appTheme.item || [];
      appTheme.item.push({ $: { name: 'colorAccent' }, _: '#10B981' });
      appTheme.item.push({ $: { name: 'colorPrimary' }, _: '#10B981' });
      appTheme.item.push({ $: { name: 'colorPrimaryDark' }, _: '#059669' });
    }
    return config;
  });
}

function withIOSGreenTheme(config) {
  return withInfoPlist(config, (config) => {
    config.modResults['UIView_tintColor'] = '#10B981';
    return config;
  });
}

module.exports = function withGreenTheme(config) {
  config = withAndroidGreenTheme(config);
  config = withIOSGreenTheme(config);
  return config;
};