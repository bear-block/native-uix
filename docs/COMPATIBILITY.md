# Compatibility and support policy

Updated: 2026-10-11. Status: **Experimental; not published for production.**

## New Architecture only

Native UIX requires React Native's **New Architecture**, using Fabric, Codegen
and native component hosts. There is no Legacy Architecture renderer, bridge
fallback or planned legacy support. The podspec rejects `RCT_NEW_ARCH_ENABLED=0`;
the Android library rejects `newArchEnabled=false`.

New Architecture is a requirement, not proof that every new RN or Expo version
works. Native code and generated C++ contracts must be built and checked together.

## Declared versions versus verified versions

| Layer | Declared constraint / configuration | Executed candidate | Meaning |
| --- | --- | --- | --- |
| React Native | `>=0.87.0 <0.88.0` peer range | `0.87.1` CLI example | 0.87.0 and other patch releases are not individually accepted |
| React | `>=19.2.0 <20` peer range | `19.2.3` example | The broad peer range is not a tested version matrix |
| Node | `.nvmrc`: `24`; example engine `>=24 <25` | Node 24 tooling | Repo development baseline, not a device runtime |
| iOS | Podspec and example deployment target `15.1` | iOS 27.0 simulator, Xcode 27.1 | iOS 15.1 is a declared floor, not completed minimum-OS acceptance |
| Android | Library and example minSdk `24` (Android 7.0) | API 34 (Android 14) emulator | API 24 and other API levels need runtime acceptance |
| Android compile SDK | `37` in library and example | Current example Debug build | Build-time SDK requirement; not minimum device OS |
| Android target SDK | `36` in the example | Current example Debug build | Consumer app chooses its target; this is not the library minSdk |
| Expo SDK | No verified SDK version | None | No Expo compatibility range is advertised |

These values come from `package.json`, `.nvmrc`, `native-uix.podspec`,
`android/build.gradle`, and `example/` platform configuration. The checked-in RN
0.87.1 CocoaPods helper also reports iOS 15.1. A consuming app must satisfy the
highest minimum imposed by RN and every native dependency; the library podspec
alone cannot establish that result.

## Native dependencies and platform availability

| Dependency / capability | Current configuration | Limit |
| --- | --- | --- |
| Kotlin | 2.2.0 | Other compiler versions not verified |
| Gradle | Example wrapper 9.4.1 | Consumer build-tool combinations need verification |
| UIKit | Objective-C++ hosts; iOS 15.1 declaration | Newer APIs require availability guards |
| Liquid Glass button configurations | Native iOS 26+ APIs | Older systems use documented gray/filled fallbacks; fallback execution remains open |
| Android Material Views | 1.13.0 | Native widget integration does not equal full Expressive coverage |
| Compose Material 3 | 1.5.0-alpha06 app bar | Alpha dependency; complete Expressive typography/shape/motion is not implemented |
| iOS scene lifecycle | Adopted by the example | Consumer apps must configure their own lifecycle; iOS 27 candidate requires it |

## Expo: intended path, no tested SDK yet

- **Expo Go: excluded.** Its fixed native binary does not contain Native UIX's
  custom Fabric components. New Architecture in Expo Go does not add those hosts.
- **Expo development/native builds: target, unverified.** A custom binary could
  include the library, but no SDK / RN / platform tuple has been accepted here.
- **Prebuild and EAS Build: unverified.** There is no tested config plugin or
  documented automatic native configuration contract for Native UIX yet.
- **Expo Router integration: unverified.** Native UIX owns its Stack/Tabs; it does
  not require Expo Router or React Navigation as a routing backend.
- **No Expo runtime dependency is required by the library.** The example uses RN
  CLI. Example-only MMKV/Nitro storage is not the library's persistence backend.

Before testing an Expo SDK, check the RN version that SDK actually includes
against Native UIX's declared peer range. Do not force-install incompatible peer
versions and describe that as supported. A future verified SDK needs its own
native build, installation and interaction evidence.

Official guidance: [Expo custom native code](https://docs.expo.dev/workflow/customizing/),
[development builds](https://docs.expo.dev/develop/development-builds/introduction/),
and [Expo New Architecture](https://docs.expo.dev/guides/new-architecture/).
These establish the integration mechanism, not Native UIX compatibility.

## Implemented, targeted and excluded

| State | Scope |
| --- | --- |
| Implemented experimentally | Native controls, bounded list/form composition, native Stack/Tabs/Sheet, provider defaults, links and route-history contracts |
| Checked on current candidates | Selected simulator/emulator builds and interactions; see the component docs |
| Targeted next | Minimum/current OS matrix, standalone consumer coverage, an explicitly chosen Expo native-build tuple, accessibility and release performance measurements |
| Incomplete | Full Material 3 Expressive behavior/styles, keyboard/form input lifecycle, full gesture/device/theme matrix |
| Excluded | Legacy Architecture, Expo Go, web/desktop renderer, React Navigation as the required routing backend |

The goal is native UI and behavior for each platform. It is not pixel identity
between platforms, complete UIKit/Material API exposure, or a measured native
speed guarantee. Captures are deferred; the mobile example remains interactive.

## When a configuration becomes supported

A production support range will require a published package plus reproducible
native builds and behavior acceptance at its declared OS/version boundaries.
Record exact RN, React, OS/API, toolchain, native dependencies and consumer setup;
check navigation, input, lifecycle, accessibility and variants. A peer range or
successful compile alone is insufficient. No release date or Expo SDK number is
promised before that work is done.

See [API boundaries](API-PROPOSAL.md), [navigation limits](NAVIGATION.md) and
[platform variants](CONFIGURATION.md).
