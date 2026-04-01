# Native UIX

**Write once. Feel native.**

Native UIX is a planned native-adaptive React Native UI framework. Its package name is `@bear-block/native-uix`. Define intent once and let iOS and Android deliver their own platform experience.

## Project status

This repository contains an unversioned feasibility spike. It is not ready for installation or production use.

Six experimental components run in the React Native CLI app in [`example/`](example/README.md):

- `Button`: UIKit button configurations on iOS (Liquid Glass on iOS 26+); Material 3 filled or outlined button on Android.
- `Switch`: controlled; a toggle only requests a change, and the control returns to `value` if the parent rejects it.
- `SegmentedControl`: controlled; `UISegmentedControl` on iOS, Material 3 segmented buttons on Android.
- `TabContent` / `TabPage`: in-screen tabs (for example under a SegmentedControl). Every page stays mounted and keeps its state; the selected page is shown natively — immediately on iOS, as UIKit tab switches are, with Material fade through on Android. App-level tab bars belong to a native navigator (`UITabBarController`, Android bottom navigation), not to this component.
- `TransitionView`: animates children that are replaced (change their `key`) with each platform's own motion — Material fade through or shared axis on Android, on iOS no animation by default (`platform`), or UIKit's cross-dissolve when chosen.
- `SettingsScreen`: native list from row descriptors; inset grouped table on iOS, Material 3 list on Android.

Debug builds have run on an iOS 27 simulator and an Android 14 emulator. Accessibility, release builds, other OS versions and performance have not been checked yet. Native UIX supports the React Native New Architecture only (React Native 0.87). Expo runtime modules are excluded.

## Navigation direction

Native UIX will own native navigation alongside its UI components, starting with a Stack navigator and platform Back behavior. The goal is one library for native application UI and navigation, without React Navigation as the routing backend. Navigation is planned, not implemented; the current Back example is a text action only. See [navigation ownership and acceptance](docs/NAVIGATION.md).

## License

MIT. See [LICENSE](LICENSE).

## Documentation

- [Project scope](docs/PROJECT-SCOPE.md)
- [Architecture direction](ARCHITECTURE.md)
- [Native navigation direction](docs/NAVIGATION.md)
- [Experimental API proposal](docs/API-PROPOSAL.md)
- [Compatibility status](docs/COMPATIBILITY.md)
- [Contributing](CONTRIBUTING.md)

Engineering research and planning are kept separately. Everything needed to install, build, test or use the eventual package will live in this repository.

The experimental [Stack](docs/API-PROPOSAL.md#experimental-stack) navigator runs on `UINavigationController` on iOS and a Material app bar with shared-axis transitions and predictive back on Android. Experimental [Tabs](docs/API-PROPOSAL.md#experimental-tabs) use `UITabBarController` on iOS and a Material 3 navigation bar on Android. The example app is built on both: three tabs, each with its own Stack. On Android the header uses Jetpack Compose Material 3 Expressive, which is only available as `material3:1.5.0-alpha06`; it moves to a stable release when one ships.
