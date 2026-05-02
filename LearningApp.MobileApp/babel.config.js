module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Strip all console.* calls from the production bundle
      ...(isProduction ? ['transform-remove-console'] : []),
    ],
  };
};
