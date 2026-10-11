# Native specifications and behaviors

Reviewed: 2026-10-11. **Experimental implementation.** Sources establish native
API and design intent; they do not prove that Native UIX implements every option
or passes every behavior. Each row below names the actual backend and its limits.

## Controls and screens

| Family | Platform specification / API | Native UIX implementation and behavior boundary |
| --- | --- | --- |
| Button, iOS | [Apple buttons HIG](https://developer.apple.com/design/human-interface-guidelines/buttons), [UIButtonConfiguration](https://developer.apple.com/documentation/uikit/uibuttonconfiguration) | UIButton configurations own surfaces and state rendering. Library selects appearance, size and semantic colors. Icon/menu contracts remain open. |
| Button, Android | [Material buttons](https://m3.material.io/components/buttons/overview), [pinned MaterialButton styles](https://github.com/material-components/material-components-android/blob/1.13.0/lib/java/com/google/android/material/button/res/values/styles.xml) | MaterialButton with native style overlays/ripple. Library minimum-height sizes do not implement the full Expressive size/shape/motion system. |
| TextField, iOS | [Text fields HIG](https://developer.apple.com/design/human-interface-guidelines/text-fields), [UITextField](https://developer.apple.com/documentation/uikit/uitextfield) | Native single-line input, plain/rounded border styles and secure rendering. Label/helper/error layout is library composition. |
| TextField, Android | [Material text fields](https://m3.material.io/components/text-fields/overview), [TextInputLayout implementation](https://github.com/material-components/material-components-android/blob/1.13.0/lib/java/com/google/android/material/textfield/TextInputLayout.java) | Filled/outlined TextInputLayout and TextInputEditText. IME, input configuration and accessibility matrix remain incomplete. |
| Switch | [UISwitch](https://developer.apple.com/documentation/uikit/uiswitch), [Material switches](https://m3.material.io/components/switch/overview) | Native switch controls request a change; React owns committed value. Rejection reconciliation is library behavior. |
| SegmentedControl | [UISegmentedControl](https://developer.apple.com/documentation/uikit/uisegmentedcontrol), [Material button groups](https://m3.material.io/components/button-groups/overview) | Persistent single selection. Current Android Material Views segmented implementation is not full Expressive button-group shape morphing. |
| List / Form, iOS | [UITableView styles](https://developer.apple.com/documentation/uikit/uitableview/style-swift.enum), [lists and tables HIG](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) | UITableView owns cells and scrolling. Changing immutable style replaces the table and restores a stable row anchor. Form is a descriptor layer over action/switch cells. |
| List / Form, Android | [Material lists](https://m3.material.io/components/lists/overview), [RecyclerView](https://developer.android.com/develop/ui/views/layout/recyclerview), [pinned divider contract](https://github.com/material-components/material-components-android/blob/1.13.0/docs/components/Divider.md) | RecyclerView with library-composed Material-themed rows and native dividers. Not a complete Expressive list-item implementation. |

## Navigation and presentation

| Family | Platform specification / API | Native UIX implementation and behavior boundary |
| --- | --- | --- |
| Stack / header, iOS | [UINavigationController](https://developer.apple.com/documentation/uikit/uinavigationcontroller), [UINavigationItem](https://developer.apple.com/documentation/uikit/uinavigationitem) | Native controller owns header, Back and transitions. Native UIX maps route state and discovers the screen scroll view. Gesture acceptance remains bounded. |
| Stack / header, Android | [Compose app bars and scroll behaviors](https://developer.android.com/develop/ui/compose/components/app-bars), [predictive Back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture) | Compose Material 3 Expressive app bar over a custom native view stack. Not Android Navigation Compose; library owns route transitions/back reconciliation. |
| Tabs | [UITabBarController](https://developer.apple.com/documentation/uikit/uitabbarcontroller), [Material navigation bar](https://m3.material.io/components/navigation-bar/overview), [navigation rail](https://m3.material.io/components/navigation-rail/overview) | Native app-tab hosts, with library adaptation/selection policy and app-owned per-tab stacks. Sidebar/rail differ by idiom and width. |
| Sheet | [UISheetPresentationController](https://developer.apple.com/documentation/uikit/uisheetpresentationcontroller), [Material bottom sheets](https://m3.material.io/components/bottom-sheets/overview) | Native detents/drag and dismissal hosts. Application commits visibility. Medium/large are geometry, not cosmetic variants. |
| Search | [UISearchController](https://developer.apple.com/documentation/uikit/uisearchcontroller), [Material search](https://m3.material.io/components/search/overview) | Header search integration; not a complete standalone search component family. |
| Motion / pages | [Material motion](https://m3.material.io/styles/motion/overview), [UIView animation](https://developer.apple.com/documentation/uikit/uiview) | Native library animation hosts. TabContent is not UIPageViewController; shared-axis/fade-through names are not UIKit style enums. |

## What “native” means here

Fabric supplies the outer frame and generated native props/events. UIKit,
Android Views and Compose execute the implemented control rendering, scrolling
and native animation. React still owns application state and content; some list
rows, navigation policies and supporting labels are library-composed native UI.
This is native integration, not a claim of complete platform behavior parity.

Trace the implementations in the public [iOS source](https://github.com/bear-block/native-uix/tree/main/ios)
and [Android source](https://github.com/bear-block/native-uix/tree/main/android/src/main/java/dev/nativeuix).
The [example module map](https://github.com/bear-block/native-uix/tree/main/example/src)
contains interactive checks rather than screenshots used as acceptance evidence.

## Performance and Expressive coverage

Native ownership keeps implemented scrolling/animations in native code, but
there is no benchmark establishing “native speed”, frame-time parity or lower
latency. Those need release builds, representative devices, frame timing,
input-to-display latency and controlled comparisons. Counters in the example
are behavior probes, not performance measurements.

[Material 3 Expressive guidance](https://m3.material.io/get-started) includes
expanded shapes, sizing, typography and motion. Native UIX currently mixes
Material Views 1.13.0 controls with a Compose Material 3 1.5.0-alpha06 app bar.
A native Material control is not automatically the complete Expressive contract.
See [unimplemented components and specifications](../project/coverage.md).
