# Compatibility status

Updated: 2026-10-04

No runtime or build configuration is currently verified for Native UIX. There is no supported version range yet.

| Environment | Planning position | Evidence required |
|---|---|---|
| React Native New Architecture | Target | Pin one stable RN release and build both platforms |
| React Native Legacy Architecture | Not supported (decided 2026-10-05) | RN 0.82+ has no Legacy Architecture; the library uses Fabric only |
| iOS / iPadOS | Target | Pin deployment target and test oldest and newest candidate OS |
| Android | Target | Derive minSdk from RN and native dependencies; execute API matrix |
| Expo native builds | Desirable compatibility | Separate native build verification; no Expo runtime requirement |
| Expo Go | Outside initial scope | Custom native code requires a suitable native binary |
| Web / desktop | Outside initial scope | No fallback renderer proposed |

Swift, Kotlin, Xcode, JDK, Gradle, AGP, Node and Compose versions remain unpinned until the feasibility application is created. Their eventual versions must be a coherent tested tuple, not independently chosen latest releases.

Newer visual APIs must use runtime availability checks and SDK-compatible builds. Older supported systems retain appropriate standard native controls. Liquid Glass is an enhancement, not a minimum-system requirement by itself.
