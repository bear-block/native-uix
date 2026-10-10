# Native navigation direction

Updated: 2026-10-05

Status: Accepted product scope; Stack (with modal routes), app-level Tabs and Sheet implemented as Experimental; Stack deep links and route-history restoration implemented as Experimental.

Native UIX will own navigation alongside its native controls and semantic screens. The goal is one library for an application's native UI and navigation experience. This is a product direction, not a claim that the current experimental package supplies a complete application framework. React Navigation is not the planned runtime dependency or routing backend. Native platform and AndroidX dependencies remain possible after compatibility and license verification.

## Ownership

| Concern | Owner |
|---|---|
| Screen registration, route intent, business state, authentication and persistence policy | Application through the Native UIX TypeScript API |
| Navigation command validation and normalized contracts | Native UIX |
| Committed stack, native screen lifecycle, transition execution and back dispatch | Native UIX navigation host |
| Stack header, navigation Back/Up control, gesture progress and cancellation | Native UIX navigation host |
| Screen title, header intent, content descriptors and scroll context | Screen through the Native UIX contract |
| List layout and scrolling | Native screen renderer |
| Business consequences of ordinary action buttons | Application callbacks |

Native UIX must reconcile native-initiated navigation with its TypeScript observer. JavaScript must not independently pop a second stack in response to an already committed native pop. Gesture cancellation does not remove a route. Animation acknowledgement and whole-app restoration protocols remain proposed. Experimental Stack snapshots are documented below.

## First milestone: native Stack

The initial experiment must implement a list → detail → back flow inside the example. Candidate operations are push, pop and replace with stable route-instance IDs and validated serializable params. The experimental `Stack` export implements this; see the [API proposal](API-PROPOSAL.md#experimental-stack).

On iOS, each stack is one `UINavigationController` with native back items, interactive swipe-back and large titles. On Android, each stack is a Native UIX view container with one Compose Material 3 Expressive app bar, `MaterialSharedAxis` transitions and one system-back owner that drives predictive back on Android 14+. Fragments are not used. Predictive back and restoration are claimed only after they are tested.

The navigator must distinguish navigation Back/Up intent from ordinary leading/trailing actions. A text label such as Back never creates navigation semantics. Native accessibility labels, RTL direction, root behavior and action availability must follow the chosen platform mechanism.

## Header and scrolling integration

The navigator owns the only header. A screen gives its title, size, subtitle and trailing action; its scroll view (`StackScrollView`, `ScrollingList`, `SettingsScreen`) is found natively. On iOS it becomes the controller's content scroll view, so the large title collapses with it and insets follow the bar. On Android it drives the app bar through nested scrolling and decides whether the bar is lifted. ScrollingScreen, which embedded its own navigation controller (iOS), was replaced by the header-less ScrollingList.

Routes below the top stay mounted, so scroll position and React state survive returning to them. TabContent remains an in-screen page container, not an app-level navigator.

## Acceptance in the example

- Push detail, use the native header Back control, and verify the previous route and scroll/state are restored.
- iOS: finish and cancel interactive swipe-back; callbacks and committed route state agree.
- Android: Back/Up icon, system back and predictive-back completion/cancellation agree without duplicate pops. At the root, defer to the host application/OS policy.
- Exercise rapid push/pop/replace, duplicate route names with distinct instance IDs, action availability, unmount and background/foreground transitions.
- Verify compact/large headers, sectioned scrolling, dark mode, RTL and screen-reader focus during navigation.
- Test both platforms from the example and a packed consumer. Builds alone do not establish gesture or lifecycle acceptance.

If predictive back or another acceptance item is unsupported by a candidate backend/version, record that limitation and do not advertise it as implemented.

## Subsequent milestones

App-level tabs exist as experimental `Tabs` (UITabBarController; Material navigation bar), and sheets as experimental `Sheet` (UISheetPresentationController; Material modal bottom sheet). Stack routes can be presented modally (`presentation: 'modal' | 'fullScreenModal'`). Stack deep-link resolution and route-history restoration are experimental; the example coordinates selected-tab and per-tab Stack restoration; restoration of application data remains app-owned. Their contracts must coordinate with the same navigation authority. Search, hero headers, icon actions and directional header motion remain independent component work; navigation ownership does not make them implemented.

See [architecture](../ARCHITECTURE.md), [scope](PROJECT-SCOPE.md), and the [experimental component API](API-PROPOSAL.md).

## Experimental deep links and saved Stack history

`Stack` accepts `initialState?: StackState` and `onStateChange?: (state: StackState) => void`.
A snapshot is `{version: 1, routes: [{key, name, params?}]}`. Restore it only after
application storage has loaded, before mounting the Stack. `initialState` is read
once; changing it does not reset an existing Stack. Invalid snapshots fall back
to `initialRoute`. `parseStackState(json, Object.keys(screens))` returns `null` for
corrupt JSON, unsupported versions, duplicate keys, empty histories, missing
screens or non-JSON params. It rejects the entire history to avoid changing its
meaning. Screen-specific parameter validation and schema migrations belong to
the app; a registered screen name does not prove that its params are valid.

`onStateChange` reports logical route changes, including committed native pops.
It is not acknowledgement that an animation finished. The application owns the
storage backend, error handling and ordered writes. Params must contain JSON
values when persisted. Snapshots restore route identity, names and params; they
do not restore component state, search text, scroll offsets, selected tabs or
other tab stacks. Repeated screen names keep distinct keys. A fresh push avoids
colliding with a restored key.

`navigation.reset([{name, params?}, ...])` replaces the entire history with fresh
route instances. It requires a nonempty array of registered screens. This also
resets local component state. An unknown screen leaves the history unchanged.

```tsx
const linking = {
  prefixes: ['myapp://'],
  resolve: (path: string) => path === 'account'
    ? [{name: 'home'}, {name: 'account'}]
    : null,
};

<Stack screens={screens} initialRoute={{name: 'home'}}
  initialState={savedState} onStateChange={saveState}
  linking={linking} onLinkHandled={() => selectAccountTab()} />
```

Keep the linking configuration, screen registry and callbacks stable. When
remounting a Stack inside an already running app, set `linking.handleInitialURL`
to `false` so the original launch URL is not replayed over the restored snapshot.
Warm URL subscriptions continue to work. The Stack
subscribes to incoming URLs and reads the initial launch URL using React Native
[Linking](https://reactnative.dev/docs/linking). A newer incoming URL wins over a
still-pending initial URL. A recognized URL replaces saved history; unrecognized
prefixes, paths or screens leave it intact. `resolveStackLink` is also exported
for applications that coordinate URL routing themselves. Prefixes match literal
strings with authority boundaries; the app explicitly owns decoding, query
parameters, authorization and route parameter validation.

Register the app's scheme in its Android intent filter and iOS URL types, and
forward URLs from the app's iOS lifecycle. The example uses UIScene and an
app-owned native inbox for both cold scene URL contexts and warm URLs from
`scene(_:openURLContexts:)`; see the startup source contract below. HTTPS App Links and Universal Links still require app/domain setup;
this example demonstrates a custom scheme only. Multiple Stacks must not
compete for the same prefix: configure a single owner or coordinate links in the
app. A Stack in a lazy tab must be mounted before it can subscribe.

In the example, each tab saves its Stack and the app saves the selected tab through MMKV (an example dependency,
not a library runtime dependency). **Open deep link to level 3** opens
`nativeuix://navigation/3`. Supported depths are 1–20. **Restore saved stack**
remounts that Stack from its last saved snapshot. Terminating and reopening the
app restores the selected tab and all four Stack histories. A Navigation launch
URL selects Navigation and overrides that Stack alone. The app coordinates these
snapshots using separate versioned keys; the library does not own storage or a
global navigation singleton. Component state and standalone Sheet presentation
are not restored. The prior Navigation-only example key is not migrated.

### Android URLs received during startup

With a `singleTask` activity, React Native forwards `onNewIntent` to JavaScript,
but a URL event can arrive before a Stack subscribes. Android `Linking.getInitialURL`
reads the activity's current intent. The application must retain the latest
intent before forwarding it:

```kotlin
override fun onNewIntent(intent: Intent) {
  setIntent(intent)
  super.onNewIntent(intent)
}
```

The example demonstrates this in `MainActivity`. Its initial URL query then
recovers the latest URL received before mounting, while warm events after
subscription keep working. This does not introduce a library-owned global
URL queue. iOS uses the separate app-owned inbox described below.

### App-owned startup URL source on iOS

`StackLinking.source?: StackLinkSource` lets a host supply its native URL inbox.
Omit it to use React Native Linking. A source provides
`subscribe(listener): () => void` and `getInitialURL(): Promise<string | null>`.
The Stack subscribes first, then queries the pending URL; a newer live URL wins
over a slower initial response. Cleanup stops delivery to an unmounted Stack.
The source owns native startup capture, delivery ordering and draining its
pending URL. Keep the source stable and assign one owner to its URL namespace.

The example's `NativeUIXExampleLinks` module captures scene URLs on the main
queue, keeps the latest one until the Stack is ready, then delivers live events.
Its initial query consumes the buffered URL and enables live delivery on the
same queue. Removing the listener returns it to buffering. This is an
example-owned React Native native module, not a library dependency. A consuming
app must implement equivalent lifecycle integration if it needs this guarantee;
plain React Native Linking does not gain a native buffer automatically.

The example queries this draining source on Stack remounts as well, so URLs
received during a remount can be handled. Its consumed launch URL is not replayed.
This differs from Android's activity initial URL, for which the example disables
re-querying on an in-app remount. The inbox is process-local and single-consumer;
it does not persist URLs across process death, support multiple scenes or apply
authentication checks. Query the source after subscribing. When using
`handleInitialURL: false`, the source must already be ready for live delivery.

On iOS, replacing an unrelated complete history uses `setViewControllers`
without animation to avoid racing initial tab-controller appearance. Ordinary
push/pop transitions still use native animation.

## Acceptance status

Navigation remains **Experimental**. Stack, Tabs, modal routes, native headers,
search, custom-scheme linking and versioned route-history restoration are
implemented. The example and standalone packed consumers have executed native
builds on iOS and Android. Local iOS Release XCUITest covers button activation,
synthetic link resolution, three Stack remounts, native Back and List → Back.
It detects the pre-fix remount failure. Android scripted consumer checks cover
the corresponding basic link/remount/system-Back flow.

The following checks remain open and do not block further experimental
component work. They still block a production navigation acceptance claim.

| Area | Status | Remaining verification |
|---|---|---|
| Gestures and rapid transitions | Partial | Existing example checks include Android cancellation and owner-reported iOS gestures; comprehensive modal, restored-history and tab-bar gesture interruption coverage remains open. XCUITest does not cover gesture cancellation. |
| Accessibility and focus | Partial | iOS Button exposes its native role; VoiceOver/TalkBack spoken output, focus after push/pop/tab switch/modal dismissal and disabled-control semantics need a full walkthrough. |
| Keyboard, rotation and adaptive layouts | Partial | Search and adaptive hosts exist; keyboard/back ordering, rotation during navigation, large text, RTL and tablet/sidebar interactions need navigation-specific acceptance. |
| Physical devices | Deferred | Hardware acceptance and performance measurements are deferred by the maintainer. Simulator/emulator results do not establish hardware behavior. |
| Hosted iOS UI regression | Pending first run | The CI job is configured; the new GitHub-hosted job has not yet executed. Local XCUITest passed. |
| Linking and restoration scope | Bounded experimental | Example custom-scheme checks passed; associated domains, multi-scene routing, authenticated URL handling and persistent URL inboxes are not established. Component state, query text and scroll offsets are excluded from route snapshots. |
| Compatibility | Unclaimed beyond executed tuples | Broader React Native/OS/device support and release readiness require separate acceptance. |

See the [packed consumer regression instructions](../tests/consumer/README.md)
for the repeatable local UI test. Keep these checks open when starting other
components; a new component does not close navigation acceptance automatically.
