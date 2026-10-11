# Component overview

All exports below are **Experimental**. The scope column distinguishes exposed
contracts from future work; visual variants do not close interaction acceptance.

| Family | Native implementation | Current scope |
| --- | --- | --- |
| [Button](../reference/BUTTON.md) | UIButton / MaterialButton | Platform appearance and size, emphasis, destructive, disabled |
| [TextField](../reference/TEXT-FIELD.md) | UITextField / TextInputLayout | Single line, secure, label/helper/error, platform variants |
| [Switch](selection.md) | UISwitch / MaterialSwitch | Controlled value, rejected requests, disabled |
| [SegmentedControl](selection.md) | UISegmentedControl / Material segmented buttons | Controlled single selection |
| [ScrollingList](../reference/LISTS-AND-FORMS.md) | UITableView / RecyclerView | Sectioned rows, native scrolling, platform appearances |
| [SettingsScreen, Form, Section](../reference/LISTS-AND-FORMS.md) | Native table / RecyclerView | Action/switch descriptors, section headers/footers |
| [Stack](../reference/NAVIGATION.md) | UINavigationController / custom native stack with Compose app bar | Routes, headers, modals, deep links, history snapshots |
| [Tabs](../reference/NAVIGATION.md) | UITabBarController / Material navigation | App tabs, adaptive layout, accessory |
| [Sheet](sheet.md) | UISheetPresentationController / Material bottom sheet | Detents and dismissal |
| [TabContent, TransitionView](motion.md) | Native view hosts | Mounted pages and bounded transition contracts |

## Read variants correctly

An appearance chooses a native presentation. Disabled, selected, error and
secure are states. Compact/large navigation titles and sheet detents affect
layout and behavior. The API does not turn every native option into a visual
variant, and the platform lists need not match.

The app can choose exposed variants and outer layout. Arbitrary font/color/icon
customization is not implemented for every component. See each API's limits.

[Native specs and behaviors](../guide/native-specs.md) · [Unimplemented coverage](../project/coverage.md) · [Capture plan](../guide/gallery.md).
