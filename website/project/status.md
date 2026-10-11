# Implementation status

Updated: 2026-10-11. **Experimental; not a production release.**

## Architecture and version policy

New Architecture is required; Legacy Architecture is excluded. RN 0.87.1 is the
checked candidate inside a declared `>=0.87.0 <0.88.0` peer range. iOS 15.1 and
Android API 24 are declared floors, not accepted minimum-OS results. No Expo SDK
is verified; Expo Go is excluded. See [exact configuration, targets and support
criteria](../reference/COMPATIBILITY.md).

## Available to evaluate

- Native controls: Button, Switch, SegmentedControl and single-line TextField.
- Native scrolling: ScrollingList, SettingsScreen and bounded Form/Section.
- Navigation: Stack, app Tabs, Sheet, modal routes, route-history snapshots and
  deep-link resolution. Native UIX owns the routing backend.
- Provider defaults: Button emphasis/appearance/size, TextField variants and
  separate ScrollingList/SettingsScreen/Form appearance choices.
- Example galleries and this documentation site. Native rendering runs in the
  mobile example; browser pages display documented APIs and a reserved capture plan.

## Checks executed for recent component work

| Check | Result and limit |
| --- | --- |
| JavaScript tests | 18 passed after list/form work; tests cover validation/defaults, not native gestures |
| TypeScript | Library and example passed |
| Native Debug builds | iOS simulator and Android emulator passed |
| Button | Owner accepted iOS gallery; Android appearance/default/disabled/size checks passed |
| TextField | Owner accepted iOS variants and behavior; Android provider switching and text retention checked |
| List/Form | Owner accepted iOS style/scroll/switch/footer checks; Android scripted checks passed |

Recent candidates: iPhone 18 Pro Max simulator on iOS 27.0 and Android API 34.
These checks do not define a supported OS range. Older-version fallbacks, tablets
and physical devices need their own acceptance.

## Still open

- Complete Material 3 Expressive coverage. Android mixes Compose app bars with
  Material Views controls; button sizing and list presentation are bounded.
- Form input/picker cells, keyboard traversal, avoidance and submission.
- Large fonts, RTL, VoiceOver/TalkBack, keyboard/switch access and live themes
  across all variants and navigation flows.
- Navigation gesture completion/cancellation, rapid operations and lifecycle
  coverage across a full device matrix.
- Automated capture matrix for every variant/state/platform. Capture publication is deferred; the reserved matrix is not a visual specification.
- Package release, version support and performance guarantees.

Follow the [component documentation](../components/index.md) for per-API limits.

[Support this work](../sponsor.md) to help turn implementation and compatibility targets into verified results.
