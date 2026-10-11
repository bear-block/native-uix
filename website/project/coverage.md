# Components and specifications not implemented yet

Updated: 2026-10-11. **Proposed / Deferred**, not exported functionality or a
release commitment. This is a bounded product inventory, not every platform API.

## Missing component families

| Family | Native references | Current gap |
| --- | --- | --- |
| Slider / Stepper | [UISlider](https://developer.apple.com/documentation/uikit/uislider), [UIStepper](https://developer.apple.com/documentation/uikit/uistepper), [Material sliders](https://m3.material.io/components/sliders/overview) | No exports; value, range, steps and interaction contracts needed |
| Date/time and general pickers | [UIDatePicker](https://developer.apple.com/documentation/uikit/uidatepicker), [UIPickerView](https://developer.apple.com/documentation/uikit/uipickerview), [Material date pickers](https://m3.material.io/components/date-pickers/overview), [time pickers](https://m3.material.io/components/time-pickers/overview) | No native picker API, locale/calendar or validation contract |
| Multiline input | [UITextView](https://developer.apple.com/documentation/uikit/uitextview), [Material text fields](https://m3.material.io/components/text-fields/overview) | TextField is single line; multiline editing not implemented |
| Menus / context menus | [UIMenu](https://developer.apple.com/documentation/uikit/uimenu), [Material menus](https://m3.material.io/components/menus/overview) | No action menu, selection or contextual invocation API |
| Alerts / dialogs | [UIAlertController](https://developer.apple.com/documentation/uikit/uialertcontroller), [Material dialogs](https://m3.material.io/components/dialogs/overview) | No library alert/action-sheet/dialog component |
| Progress / loading | [UIProgressView](https://developer.apple.com/documentation/uikit/uiprogressview), [UIActivityIndicatorView](https://developer.apple.com/documentation/uikit/uiactivityindicatorview), [Material progress indicators](https://m3.material.io/components/progress-indicators/overview) | No exports; Expressive indicator motion also missing |
| Chips / checkbox / radio | [Material chips](https://m3.material.io/components/chips/overview), [checkbox](https://m3.material.io/components/checkbox/overview), [radio button](https://m3.material.io/components/radio-button/overview) | No exported selection families; iOS mapping needs its own design |
| FAB / split and icon buttons / toolbar | [Material FAB](https://m3.material.io/components/floating-action-button/overview), [icon buttons](https://m3.material.io/components/icon-buttons/overview), [UIToolbar](https://developer.apple.com/documentation/uikit/uitoolbar) | Current Button is text-based; specialized action layouts are absent |
| Cards / carousel / snackbar / tooltip | [Material components](https://m3.material.io/components) | No dedicated exports or platform adaptation contracts |
| Popovers / page indicators | [UIPopoverPresentationController](https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller), [UIPageControl](https://developer.apple.com/documentation/uikit/uipagecontrol) | No anchor/lifecycle/scrubbing contracts |

## Incomplete specifications in existing components

| Component | Missing or unclosed specification |
| --- | --- |
| Button | Full Android Expressive size typography, shape morphing and motion; icons/menu; broad customization; older-iOS fallback acceptance |
| TextField | Keyboard/input configuration, Next/Done traversal, IME matrix, avoidance, large text and richer input accessibility |
| Form | TextField/picker cells, validation/submit and input lifecycle; arbitrary child controls |
| Lists | Full Expressive list-item shapes/interactions; swipe/reorder/selection; simultaneous data/style changes and active-drag retention |
| SegmentedControl | Icons, momentary selection, width policy, Expressive group morphing |
| Stack / Tabs | Complete gesture/lifecycle/a11y/device matrix; route animation acknowledgment; whole-app state restoration policy |
| Sheet | Tablet/popover anchoring, richer presentation contracts and full dismissal matrix |
| Motion | Reduced Motion acceptance, focus continuity, full spring/Expressive motion system |
| All components | Full light/dark/live-theme, RTL, large text, keyboard/switch access and VoiceOver/TalkBack matrix |

## Documentation and release work

Captures are deferred. The [capture plan](../guide/gallery.md) reserves states
and metadata without claiming images already exist. Performance measurements,
production version support, broader devices and package publication remain open.

Read [native specs and actual implementation boundaries](../guide/native-specs.md)
before interpreting a reference link as a completed behavior guarantee.
