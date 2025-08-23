# Native UIX

**Write once. Feel native.**

Native UIX is a planned native-adaptive React Native UI framework. Its package name is `@bear-block/native-uix`. Define intent once and let iOS and Android deliver their own platform experience.

## Project status

This repository contains an unversioned feasibility spike. It is not ready for installation or production use.

Five experimental components run in the React Native CLI app in [`example/`](example/README.md):

- `Button`: UIKit button configurations on iOS (Liquid Glass on iOS 26+); Material 3 filled or outlined button on Android.
- `Switch`: controlled; a toggle only requests a change, and the control returns to `value` if the parent rejects it.
- `SegmentedControl`: controlled; `UISegmentedControl` on iOS, Material 3 segmented buttons on Android.
- `TransitionView`: animates children that are replaced (change their `key`) with native motion — Material fade through or shared axis on Android, UIKit cross-dissolve, fade through or push-like slide on iOS.
- `SettingsScreen`: native list from row descriptors; inset grouped table on iOS, Material 3 list on Android.

Debug builds have run on an iOS 27 simulator and an Android 14 emulator. Accessibility, release builds, other OS versions and performance have not been checked yet. Native UIX supports the React Native New Architecture only (React Native 0.87). Expo runtime modules are excluded.

## License

MIT. See [LICENSE](LICENSE).

## Documentation

- [Project scope](docs/PROJECT-SCOPE.md)
- [Architecture direction](ARCHITECTURE.md)
- [Experimental API proposal](docs/API-PROPOSAL.md)
- [Compatibility status](docs/COMPATIBILITY.md)
- [Contributing](CONTRIBUTING.md)

Engineering research and planning are kept separately. Everything needed to install, build, test or use the eventual package will live in this repository.
