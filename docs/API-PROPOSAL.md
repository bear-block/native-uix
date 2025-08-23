# Experimental API proposal

Status: Experimental · Spike implemented · 2026-10-04

```tsx
import {Button, SegmentedControl, SettingsScreen, Switch, TransitionView} from '@bear-block/native-uix';

<Button label="Save" variant="primary" onPress={save} />
<Button label="Delete account" destructive onPress={confirmDelete} />
<Switch label="Notifications" value={enabled} onValueChange={setEnabled} />
<SegmentedControl
  segments={[{id: 'day', label: 'Day'}, {id: 'week', label: 'Week'}]}
  value={range}
  onValueChange={setRange}
/>
<TransitionView motion="fadeThrough" style={{flex: 1}}>
  {tab === 'a' ? <ScreenA key="a" /> : <ScreenB key="b" />}
</TransitionView>
<SettingsScreen
  title="Settings"
  sections={[{id: 'preferences', title: 'Preferences', rows: [
    {id: 'notifications', kind: 'switch', label: 'Notifications', value: enabled},
    {id: 'privacy', kind: 'action', label: 'Privacy'},
  ]}]}
  onAction={event => {
    if (event.type === 'valueChange' && event.rowId === 'notifications') {
      setEnabled(event.value);
    } else if (event.type === 'press' && event.rowId === 'privacy') {
      openPrivacy();
    }
  }}
/>
```

These components exist as an experimental spike (see the [example app](../example/README.md)); their API may still change. `label` is a string in the initial Button contract; arbitrary JSX content is deferred. `variant` (`primary` or `secondary`, default `secondary`) sets visual emphasis and `destructive` marks a destructive action. The prop is not called `role`, because React Native already uses `role` for accessibility; the native accessibility role stays button.

Switch takes the same optional `disabled` and `accessibilityLabel` props as Button. Controlled Switch values come from React props. Native interactions request changes; applying props must not trigger duplicate user callbacks. Uncontrolled mode is a later proposal with a one-time `defaultValue`. Mixing modes or changing mode during a mount is invalid.

The Settings proposal accepts serializable rows with unique IDs. Function callbacks remain at the JS boundary. Native screens receive normalized descriptors, never serialized closures. The first supported row kinds would be `switch` and `action`; other kinds need separate contracts. A `switch` row is controlled like Switch: its `value` comes from the descriptor, and a `valueChange` event only requests a change.

Each component accepts an outer `style` (margins, flex, width); Button and Switch measure themselves natively and use the result as a minimum size. Arbitrary control appearance styling is not promised. Accessibility label overrides must preserve the native value and role. Navigation and business operations run in application callbacks.

`TransitionView` motion is an intent (`platform`, `fadeThrough`, `sharedAxisX`, `none`); each platform supplies its own motion, and Reduce Motion or the system animator scale always win. The library does not depend on Reanimated.

See [architecture](../ARCHITECTURE.md) and [compatibility](COMPATIBILITY.md).
