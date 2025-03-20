const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    path: require.resolve('path-browserify'),
    assert: require.resolve('assert'),
    fs: require.resolve('expo-file-system'),
};
config.resolver.blockList = [
    /node_modules\/@babel\/core\/.*/,
    /node_modules\/@babel\/helper-.*/,
];

module.exports = config;