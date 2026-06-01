// SPEC-UI-002: worklets-core + reanimated 플러그인 (reanimated는 반드시 마지막)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets-core/plugin',
      'react-native-reanimated/plugin',
    ],
  };
};
