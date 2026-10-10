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
| `header.search` | `UISearchController`; `placement` maps to `preferredSearchBarPlacement` (`integrated`, `integratedButton` on iOS 26+) | Material 3 Expressive `AppBarWithSearch` with a search input field |

The search field owns its text and reports it through `search.onChangeText`, `onSubmit` and `onCancel`; `useStackSearchText()` returns the current text inside the route, for filtering its content.

`navigation` offers `push(name, params)`, `pop()`, `popToRoot()` and `replace(name, params)`; `useStackNavigation()` and `useStackRoute()` read them from any component in a screen. React declares the routes and the platform runs every transition. A pop the user commits natively is reported once and removed from the route list; a cancelled swipe or predictive back changes nothing. Routes below the top stay mounted, so their React state and scroll positions survive.

A route with `hidesTabBar: true`, pushed on the Stack of a tab, covers the tab bar: on iOS the bar slides away with the push (`hidesBottomBarWhenPushed`), on Android the navigation bar slides down. A route with `presentation: 'modal'` starts a new stack presented over the current one: on iOS a page sheet in its own `UINavigationController` (swipe down to close), on Android a Material full-screen dialog that rises with a vertical shared axis and covers the tab bar. `presentation: 'fullScreenModal'` covers the whole screen on iOS and is the same as `modal` on Android. The modal's first route has a close button in place of back; routes pushed after it stack inside the modal; `pop()` on its first route closes it, and a native close or swipe-down is reported like a native pop. A route with `header: null` shows no header. A Stack nested in another Stack reaches it with `navigation.parent`; on iOS avoid nesting a Stack in a Stack route for full-screen content, because UIKit does not extend a nested navigation bar under the status bar.

Use `StackScrollView` (or `ScrollingList`, `SettingsScreen`) as a screen's scroll view: on iOS its insets follow the navigation bar and the large title collapses with it; on Android it drives the app bar through nested scrolling. On Android the stack extends under the status bar (edge to edge) and keeps its app bar below it. At the root, back is left to the app and the OS. App-level Tabs, Stack deep links and route-history restoration are experimental; see [navigation](NAVIGATION.md).

## Experimental Tabs

```tsx
<Tabs initialTab="home" onTabChange={id => console.log(id)}>
  <Tab id="home" title="Home" icon={{ios: 'house', android: 'Home'}}>
    <Stack screens={screens} initialRoute={{name: 'home'}} />
  </Tab>
  <Tab id="settings" title="Settings" icon={{ios: 'gearshape', android: 'Settings'}} badge="2">
    <Stack screens={screens} initialRoute={{name: 'settings'}} />
  </Tab>
</Tabs>
```

| | iOS | Android |
|---|---|---|
| Container | `UITabBarController` (Liquid Glass on iOS 26+) | Compose Material 3 `NavigationBar` |
| Icon | SF Symbol name (`icon.ios`) | Material core icon name or app drawable name (`icon.android`) |
| Badge | Tab bar item badge | Navigation bar badge |
| Switching | Instant, as UIKit | Material fade through |
| Back | — | System back on another tab returns to the first tab |
| Re-selecting the selected tab | Its Stack pops to the root (UIKit) | Its Stack pops to the root |
| `role: 'search'` | `UISearchTab` (iOS 18+); on iOS 26 a separate trailing button whose field expands in the tab bar and activates the tab's Stack root search | A regular tab with the Material search icon |
| `minimizeBehavior` (`automatic`, `never`, `onScrollDown`, `onScrollUp`) | `tabBarMinimizeBehavior` (iOS 26+): the bar minimizes to the selected tab | The navigation bar slides away and back (hide on scroll); `automatic` keeps it |
| `layout` (`automatic`, `tabBar`, `sidebar`) | `UITabBarController.mode` (iOS 18+): `sidebar` shows the tabs in a sidebar on iPad, which the user can collapse to the tab bar | From 600 dp wide (rotation, tablets, foldables) a Material `NavigationRail` at the start edge; `tabBar` keeps the bottom bar |
| `accessory` | `bottomAccessory` (`UITabAccessory`, iOS 26+): Liquid Glass above the bar, inline beside the minimized bar; nothing before iOS 26 | A floating Material surface (28 dp corners) 8 dp above the navigation bar; it moves down when the bar slides away |

A tab's content mounts the first time it is selected (`lazy`, default true) and then stays mounted, so each tab's Stack keeps its routes. Pass `selectedTab` to control the selection, or `initialTab` to let the bar keep it; `onTabChange` reports a tab the user selected after the bar has switched. When a tab's first child is a Stack, iOS uses the Stack's `UINavigationController` as the tab's view controller, as UIKit expects. On iOS 18+ tabs are `UITab` objects.

`accessory` is React content shown with the tab bar on every tab, such as a mini player; the platform sizes it and the content fills that size. `useTabsAccessoryPlacement()` returns `regular` or `inline` (iOS 26+, beside the minimized bar, where it is smaller), so the content can drop detail. Routes with `hidesTabBar` keep the accessory at the bottom, as UIKit does; modals cover it. On Android the rail stays beside every route (only a modal covers it), and the header leaves the start display cutout to the rail. Not implemented yet: tab groups and sections in the sidebar, `compactTabIdentifiers`, the expanded wide rail (see the roadmap in the internal gap analysis).

## Experimental Sheet

```tsx
const [open, setOpen] = React.useState(false);

<Sheet visible={open} detents={['medium', 'large']} onDismiss={() => setOpen(false)}>
  <MyContent />
</Sheet>
```

| | iOS | Android |
|---|---|---|
| Presentation | `UISheetPresentationController` (page sheet) | Material 3 modal bottom sheet (`BottomSheetBehavior`) in React Native's `Modal` window |
| `detents` | `medium`, `large`; the first is where it opens | Half and full height, below the status bar |
| `grabber` | `prefersGrabberVisible` | `BottomSheetDragHandleView` |
| `dismissible: false` | `modalInPresentation` | Cannot be dragged away; scrim taps and back are ignored |
| Closing | Drag down, or `visible={false}` | Drag down, scrim tap, back, or `visible={false}` |

Closing always runs the native animation first and then calls `onDismiss` once; set `visible` to false there. `onDetentChange` reports the height the user settled on. The content is laid out at the size of the presented sheet.

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
