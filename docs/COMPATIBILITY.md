# Compatibility status

Updated: 2026-10-11. Status: **Experimental**. There is no supported production
version range. Candidate builds and interactions below are narrower than a
compatibility guarantee.

| Environment | Current position | Remaining verification |
| --- | --- | --- |
| React Native | 0.87.1 example, Fabric/New Architecture only | Other versions and standalone consumer matrix |
| React | 19.2.3 example | Other versions |
| iOS | Simulator iOS 27.0, Xcode 27.1 Debug builds and selected interactions | Older OS fallbacks, iPad, devices, accessibility |
| Android | API 34 emulator, Debug builds and selected interactions | API/device matrix, accessibility and full lifecycle coverage |
| Legacy Architecture | Excluded | No legacy renderer |
| Expo native builds | Not verified | Separate native build integration |
| Expo Go | Outside scope | Custom native code requires its own binary |
| Web / desktop | Outside scope | Documentation captures are not a web renderer |

Current source declares iOS 15.1 in the podspec and Android minSdk 24 / compileSdk
37. These are build settings, not runtime acceptance of every included version.
Node 24 is pinned for local tooling. Android uses Kotlin 2.2.0, Material Views
1.13.0 and a Compose Material 3 1.5.0-alpha06 app bar. Expressive coverage is
partial and includes an alpha dependency.

Newer UIKit configurations have native availability guards and documented
fallbacks. Older-system execution remains open. Liquid Glass availability does
not make it the minimum deployment target.

The iOS example adopts the UIKit scene lifecycle for its iOS 27 candidate.
A consuming application must verify its own lifecycle and native configuration.
See the [current component contracts](API-PROPOSAL.md) and
[navigation limits](NAVIGATION.md).
