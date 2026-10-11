# Button

Status: **Experimental**. UIKit UIButton on iOS and MaterialButton on Android.

```tsx
<Button label="Continue" variant="primary"
  appearance={{ios: 'filled', android: 'tonal'}}
  size={{ios: 'medium', android: 'medium'}} onPress={continueFlow} />
```

`variant` retains the existing primary/secondary emphasis. `appearance` selects
a platform's native surface independently. With an explicit appearance,
primary/secondary does not override that choice. `destructive` changes the
library's semantic colors; it is not a separate surface or an alert action role.
`disabled` uses native disabled interaction and appearance. `accessibilityLabel`
replaces the spoken label; native Button accessibility ownership is retained.

Defaults resolve separately for emphasis, appearance and size: explicit prop,
nearest provider, then library fallback. See [Configuration](CONFIGURATION.md).
A partial platform object inherits the other platform. Library defaults remain
secondary/automatic, with large size on iOS and small on Android.

## iOS appearances

Each name maps directly to UIButtonConfiguration's corresponding factory:

| Appearance | Presentation | Before iOS 26 |
| --- | --- | --- |
| `automatic` | Existing library mapping: secondary glass, primary prominentGlass on 26+ | Secondary gray / primary filled, capsule corners |
| `plain` | Plain configuration | Same factory |
| `gray` | Gray configuration | Same factory |
| `tinted` | Tinted configuration | Same factory |
| `filled` | Filled configuration | Same factory |
| `borderless` | Borderless configuration | Same factory |
| `bordered` | Bordered configuration | Same factory |
| `borderedTinted` | Tinted bordered configuration | Same factory |
| `borderedProminent` | Prominent bordered configuration | Same factory |
| `glass` | Glass configuration | Gray |
| `prominentGlass` | Prominent glass configuration | Filled |
| `clearGlass` | Clear glass configuration | Gray |
| `prominentClearGlass` | Prominent clear glass configuration | Filled |

The factory owns rendering and state adaptation. Distinct factory names need
not produce distinct pixels in every context or OS release. Glass availability
is gated in native code; older-OS fallback behavior is implemented but not
runtime accepted in this batch. `automatic` is a library compatibility policy,
not a claim that glass is suitable for every content action.

UIKit sizes are `mini`, `small`, `medium`, `large`. The button configuration
controls typography and content geometry. Native measurement reserves at least
44 points for the outer interaction frame; explicit layout overrides can change
that frame. Long titles wrap and are measured natively.

## Android appearances and sizes

`automatic` retains filled for primary, outlined for secondary. Explicit choices
are `filled`, `tonal`, `outlined`, `text`, `elevated`. They use the corresponding
Material 3 widget styles, theme overlays, native state color lists and elevation
animators. A MaterialButton stays alive across appearance updates to preserve
native press/ripple ownership. Destructive filled uses error/on-error colors;
other destructive surfaces use error-colored content and an error outline when
applicable. Disabled colors stay native/stateful.

Android sizes `small`, `medium`, `large` currently reserve 48, 64, 104 dp minimum
outer height, including 4 dp native vertical insets on each side. Text can require
more height. This is a bounded library sizing contract over Material Views;
font/shape morphing and the complete Material 3 Expressive sizing/motion contract
are not implemented. It does not expose an Android `mini` size.

`style` controls outer layout, not UIKit/Material appearance. No general native
font/color/icon customization API is added in this batch. Icon-only and menu
buttons need separate contracts.

## Example and acceptance

Components → Buttons contains every platform appearance with normal,
destructive and disabled samples, plus every supported size. Tap a normal
sample to update the press count; disabled samples must not change it. Change
button defaults affects the provider-driven sample; explicit appearance samples
stay unchanged. The gallery is a basis for future docs captures, not published
capture automation.

Open acceptance includes large text, dark/light and live theme changes, RTL,
VoiceOver/TalkBack output, keyboard/switch access, older-OS fallback execution,
iPad placement and real devices. Capture metadata must include OS, appearance,
size and state. Passing a factory to UIKit does not establish HIG suitability
for every placement.

## Primary references

Reviewed 2026-10-11:

- [UIButtonConfiguration](https://developer.apple.com/documentation/uikit/uibuttonconfiguration), plus Xcode 27.1 SDK UIButtonConfiguration.h availability declarations.
- [Material common buttons](https://github.com/material-components/material-components-android/blob/1.13.0/docs/components/CommonButton.md).
- [Pinned Material widget styles](https://github.com/material-components/material-components-android/blob/1.13.0/lib/java/com/google/android/material/button/res/values/styles.xml).
