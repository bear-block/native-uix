# Experimental API proposal

Status: Experimental · Spike implemented · 2026-10-04

```tsx
import {
  Button,
  SegmentedControl,
  SettingsScreen,
  Switch,
  TabContent,
  TabPage,
  TransitionView,
} from '@bear-block/native-uix';

<Button label="Save" variant="primary" onPress={save} />
<Button label="Delete account" destructive onPress={confirmDelete} />
<Switch label="Notifications" value={enabled} onValueChange={setEnabled} />
<SegmentedControl
  segments={[{id: 'day', label: 'Day'}, {id: 'week', label: 'Week'}]}
  value={range}
  onValueChange={setRange}
/>
<TabContent value={tab} style={{flex: 1}}>
  <TabPage id="a"><ScreenA /></TabPage>
  <TabPage id="b"><ScreenB /></TabPage>
</TabContent>
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

`TabContent` keeps every page mounted and only changes which one is visible; use it for tabs inside a screen. `TransitionView` replaces content (change a child's `key`). Motion is an intent (`platform`, `fadeThrough`, `sharedAxisX`, `none`); each platform supplies its own motion — Material motion on Android; on iOS `platform` is no animation, as UIKit tab and content switches are, and the other intents use UIKit's cross-dissolve — and Reduce Motion or the system animator scale always win. The library does not depend on Reanimated.

See [architecture](../ARCHITECTURE.md) and [compatibility](COMPATIBILITY.md).

## Experimental Stack

```tsx
const screens = {
  home: {component: Home, header: {title: 'Library', subtitle: 'Your reading collection'}},
  detail: {
    component: Detail,
    header: (route, navigation) => ({
      title: (route.params as {title: string}).title,
      size: 'compact',
      trailingAction: {label: 'Done', onPress: navigation.popToRoot},
    }),
  },
};

<Stack screens={screens} initialRoute={{name: 'home'}} />;

function Home({navigation}: StackScreenProps) {
  return <ScrollingList items={items} onItemPress={id => navigation.push('detail', {title: id})} />;
}
```

| | iOS | Android |
|---|---|---|
| Container | `UINavigationController` | Compose Material 3 Expressive app bar over a view stack |
| Push / pop | UIKit push and pop | Material shared axis X |
| Back | Back button, interactive edge swipe | Up button, system back, predictive back on Android 14+ |
| `header.size: 'large'` (default) | Large title that collapses with the screen's scroll view | `LargeFlexibleTopAppBar` that collapses with nested scrolling |
| `header.size: 'compact'` | Inline title | Small `TopAppBar` that tints when content scrolls under it |
| `header.subtitle` | Navigation subtitle (iOS 26+), prompt before | App bar subtitle |
| `header.trailingAction` | Bar button item | App bar action |

`navigation` offers `push(name, params)`, `pop()`, `popToRoot()` and `replace(name, params)`; `useStackNavigation()` and `useStackRoute()` read them from any component in a screen. React declares the routes and the platform runs every transition. A pop the user commits natively is reported once and removed from the route list; a cancelled swipe or predictive back changes nothing. Routes below the top stay mounted, so their React state and scroll positions survive.

Use `StackScrollView` (or `ScrollingList`, `SettingsScreen`) as a screen's scroll view: on iOS its insets follow the navigation bar and the large title collapses with it; on Android it drives the app bar through nested scrolling. On Android the stack extends under the status bar (edge to edge) and keeps its app bar below it. At the root, back is left to the app and the OS. Modals, app-level tabs, deep links and state restoration are not implemented.

## Experimental ScrollingList

```tsx
<ScrollingList
  items={[
    {id: 'intro', section: 'Getting started', title: 'Introduction', action: true},
    {id: 'about', section: 'Getting started', title: 'About', subtitle: 'Informational row'},
  ]}
  onItemPress={id => console.log(id)}
/>
```

A native sectioned list: an inset grouped `UITableView` on iOS, a `RecyclerView` with Material 3 list items on Android. Rows with `action: true` are pressable (disclosure indicator on iOS); others are informational. IDs must be unique and nonempty. The list has no header of its own; inside a Stack screen the navigator's header collapses with it.
