# Native navigation direction

Updated: 2026-10-05

Status: Accepted product scope; Stack and app-level Tabs implemented as Experimental; modals, deep links and restoration not implemented.

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

Native UIX must reconcile native-initiated navigation with its TypeScript observer. JavaScript must not independently pop a second stack in response to an already committed native pop. Gesture cancellation does not remove a route. Exact command serialization, acknowledgement and restoration protocols are proposed until tested.

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

App-level tabs exist as experimental `Tabs` (UITabBarController; Material navigation bar), and sheets as experimental `Sheet` (UISheetPresentationController; Material modal bottom sheet). Full-screen modal routes, deep-link resolution and process restoration follow. Their contracts must coordinate with the same navigation authority. Search, hero headers, icon actions and directional header motion remain independent component work; navigation ownership does not make them implemented.

See [architecture](../ARCHITECTURE.md), [scope](PROJECT-SCOPE.md), and the [experimental component API](API-PROPOSAL.md).
