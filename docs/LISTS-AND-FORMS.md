# Lists and forms

Status: **Experimental**. ScrollingList and SettingsScreen/Form own native
scrolling: UITableView on iOS, RecyclerView on Android. Do not wrap these
full-height components in another vertical ScrollView.

## Appearance and defaults

`appearance` is a platform object. iOS choices `plain`, `grouped`, `insetGrouped`
map to UITableView.Style. Android choices `plain`, `divided` retain the existing
Material-themed rows; divided adds native MaterialDividerItemDecoration between
adjacent rows in a section. Headers, footers and section boundaries have no
trailing divider. Android names are library composition choices, not UIKit
styles or a complete Material 3 Expressive list implementation.

The fallback is iOS insetGrouped, Android plain. Defaults resolve from explicit
prop, component-specific provider config, then platform fallback:

```tsx
<NativeUIXProvider config={{components: {
  scrollingList: {appearance: {ios: 'plain', android: 'divided'}},
  settingsScreen: {appearance: {ios: 'insetGrouped', android: 'plain'}},
  form: {appearance: {ios: 'insetGrouped', android: 'divided'}},
}}}>
  <App />
</NativeUIXProvider>
```

Form defaults are independent of SettingsScreen defaults, even though they
share the native sectioned settings backend. A partial platform object inherits
the other platform from its component's provider configuration.

UIKit table style is immutable. Appearance updates replace the table, capture
a stable visible row ID and its position, and restore it after layout. If that
row no longer exists, the old offset is clamped to the new content range. This
is not a persistence API or a guarantee of identical offsets across differing
section/header geometries. Android retains its RecyclerView and layout-manager
state when adding/removing the divider. Controlled switch values come from
the committed descriptors after any appearance update.

## Form and Section

```tsx
<Form onAction={action => {
  if (action.type === 'valueChange' && action.rowId === 'notifications') {
    setNotifications(action.value);
  }
}}>
  <Section id="preferences" title="Preferences" footer="Changes apply immediately."
    rows={[
      {id: 'notifications', kind: 'switch', label: 'Notifications', value: notifications},
      {id: 'details', kind: 'action', label: 'Details'},
    ]} />
</Form>
```

Form accepts direct Section children, including arrays and conditional null
children. Section is a descriptor, not an independently rendered native view.
Fragments, custom wrapper components and arbitrary React children are rejected.
Section props: nonempty unique `id`, optional `title`/`footer`, and `rows`.
Row IDs must be nonempty and unique across the form. Rows currently support
only `action` and controlled `switch`, with optional `disabled`.

Form shares SettingsScreen's `title`, `style`, `onAction`, and appearance props.
SettingsSection also accepts `footer`, so existing SettingsScreen consumers can
use the same native footer behavior. Footers are explanatory text, not actions.
An unaccepted switch request is reconciled to its committed value.

This first Form contract does not embed TextField, pickers or arbitrary native
controls in cells. It does not add validation, submit, keyboard avoidance or
input focus traversal. Those need dedicated cell/control lifecycle contracts.
Use the standalone TextField API for current text entry.

## Example and verification

Components → List appearances shows every platform appearance through explicit
selection and provider defaults. Scroll to a recognizable row, change appearance
or the default, and check the row remains nearby. Informational/disabled rows
must not increment List presses. An explicit appearance remains selected while
the provider default changes; choose Default to follow it again.

Components → Form and sections includes header/footer text, accepted/rejected/
locked switches, enabled/disabled actions and sixty rows for scroll checks.
Changing appearance must retain Notifications. Rejected stays off, Locked
stays on, and disabled actions do not update Form presses. The example supplies
outer layout only; native presentation lives in the library.

Owner interaction checks passed on the iOS simulator for appearance changes,
scroll position, switches and headers/footers. This does not establish broad
platform compatibility.

Open acceptance: large text, RTL, spoken
accessibility, live theme changes, tablet geometry, appearance changes during
active drag/deceleration, simultaneous row removal/reorder, and physical devices.
These remain experimental APIs; a build does not close the behavior matrix.

## Primary references

Reviewed 2026-10-11:

- [UITableView.Style](https://developer.apple.com/documentation/uikit/uitableview/style-swift.enum), also checked against Xcode 27.1 UIKit UITableView.h.
- [Material dividers, pinned 1.13.0](https://github.com/material-components/material-components-android/blob/1.13.0/docs/components/Divider.md).
- [MaterialDividerItemDecoration implementation, pinned 1.13.0](https://github.com/material-components/material-components-android/blob/1.13.0/lib/java/com/google/android/material/divider/MaterialDividerItemDecoration.java).
