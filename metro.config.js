const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to the asset extensions so Metro can bundle expo-sqlite's web assembly binary
config.resolver.assetExts.push('wasm');

module.exports = config;
