const path = require('node:path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');
const escape = value => value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
// Peer dependencies must come from this app only; the library root has its
// own dev copies, and loading both would create two React instances.
const peers = ['react', 'react-native'];

const config = {
  watchFolders: [root],
  resolver: {
    blockList: peers.map(
      name =>
        new RegExp(`^${escape(path.join(root, 'node_modules', name))}\\/.*$`),
    ),
    extraNodeModules: Object.fromEntries(
      peers.map(name => [name, path.join(__dirname, 'node_modules', name)]),
    ),
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
