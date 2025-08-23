export default {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        libraryName: 'NativeUIXSpec',
        // Custom shadow nodes (common/cpp) are registered next to generated ones.
        componentDescriptors: [
          'NativeUIXButtonComponentDescriptor',
          'NativeUIXSwitchComponentDescriptor',
          'NativeUIXSegmentedControlComponentDescriptor',
          'NativeUIXSettingsComponentDescriptor',
          'NativeUIXTransitionViewComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
      ios: {podspecPath: './native-uix.podspec'},
    },
  },
};
