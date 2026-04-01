const path = require('node:path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');
const escape = value => value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
// Peer dependencies must come from this app only; the library root has its
// own dev copies, and loading both would create two React instances.
const peers = ['react', 'react-native'];
// Native build output changes on every Gradle or Xcode build; watching it
// makes Metro reload the apps over and over.
const nativeOutput = [
  path.join(root, 'android', 'build'),
  path.join(root, 'android', '.cxx'),
  path.join(__dirname, 'android', 'build'),
  path.join(__dirname, 'android', 'app', 'build'),
  path.join(__dirname, 'android', 'app', '.cxx'),
  path.join(__dirname, 'android', '.gradle'),
  path.join(__dirname, 'ios', 'build'),
  path.join(__dirname, 'ios', 'Pods'),
];

const config = {
  watchFolders: [root],
  resolver: {
    blockList: [
      ...peers.map(name => path.join(root, 'node_modules', name)),
      ...nativeOutput,
    ].map(dir => new RegExp(`^${escape(dir)}\\/.*$`)),
    extraNodeModules: Object.fromEntries(
      peers.map(name => [name, path.join(__dirname, 'node_modules', name)]),
    ),
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
