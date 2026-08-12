# Native UIX example

This React Native CLI app is the interactive acceptance surface for Native UIX. Each implemented capability must have a visible, manually testable scenario here.

## What to check

The app is native `Tabs` (Components, Navigation, Settings, and a Search tab), each tab with its own `Stack`. Switching tabs keeps each tab's routes; on Android, back on another tab returns to Components. **Home** lists the component demos; each row pushes a route. **Over the tab bar** is a `hidesTabBar` route: the tab bar slides away with the push. Tapping the selected tab returns its Stack to the first route. Scrolling down minimizes the tab bar (iOS 26+) or slides the navigation bar away (Android); scrolling up brings it back. Go back with the back button, an edge swipe (iOS), or system back and predictive back (Android 14+). Routes you come back to keep their state and scroll position.

**Navigation**

1. Home has a large title that collapses as the list scrolls.
2. **Navigation tab**: odd levels use a large title, even levels a compact one. **Count** survives pushing and coming back. **Replace**, **Pop**, **Pop to root** and the **Done** header action do what they say, with native motion.
3. Start an edge swipe (iOS) or a predictive back gesture (Android) and cancel it: nothing is popped.

**Buttons**: **Continue** counts each tap once; every enabled button adds a line to the event log, **Disabled** never does; long labels wrap, short buttons hug their text.

**Switches**: **Wi-Fi** animates and its label follows; **Locked** animates, then returns to off because the parent rejects the change.

**Segmented control**: selection uses the platform's own motion.

**Tab content**: pages stay mounted; each page's count and scroll position survive switching. The second control picks the motion; `Default` is no animation on iOS and Material fade through on Android.

**Settings tab**: **Airplane mode** animates without the list reloading and disables **Network**; **Data roaming** returns to off (rejected); action rows push a detail route.

**Modal** and **Full-screen modal** present a `presentation: 'modal'` route (page sheet on iOS, full-screen dialog on Android) with a close button and Save; *Push inside the modal* stacks a route inside it. Close with the close button, Save, swiping the sheet down (iOS) or back (Android).

**Sheet**: open the resizable sheet and drag between medium and large; drag down, tap outside or press back to close. The locked sheet closes only with its button.

**Scrolling list**: a header search field filters the 80 sectioned rows; pressable rows push a detail route, informational rows do not respond.

Toggle dark mode while the app runs: every screen, the header and the system bars follow it.

On iOS, launch arguments help automated captures: `-NativeUIXTab <id>` starts on a tab, `-NativeUIXRoute <name>` starts the Components tab on a route (for example `tabs`), and `-NativeUIXTab navigation -NativeUIXScript 1` pushes twice, pops, then pops to the root, 2 s apart.

## Run

Use Node 24 (`.nvmrc`).

```sh
npm install
npm start
```

In a second terminal:

```sh
npm run android
# or
cd ios && pod install && cd .. && npm run ios
```

The example depends on the library through `file:..`. `metro.config.js` blocks the library's own copies of `react` and `react-native` so that only one React instance is loaded.

Release builds bundle JavaScript only when files under `example/` change; Gradle does not track the library's `src/`. After changing library JavaScript, run `./gradlew :app:installRelease --rerun-tasks` (or touch `App.tsx`).

The iOS app uses a `SceneDelegate`, because iOS 27 terminates apps that do not adopt the UIScene lifecycle.

## Scrolling scenario (experimental)

Open **Scrolling** to test the native-owned list and collapsing title.

1. Scroll upward: the expanded title collapses into the top bar.
2. Return to the start: the large title expands.
3. Switch to Controls and back: verify that the scroll position is retained.
4. Check dark mode, larger system text, rotation, and screen-reader navigation.

Android uses Compose Material 3 Expressive (`1.5.0-alpha06`), dynamic colors on API 31+, and a fallback color scheme below API 31. This is an experimental dependency, not a release compatibility guarantee. iOS uses a child UINavigationController and UITableViewController. The app owns routes and outer layout; the component owns its header and list scroll. Rows can be informational or actionable; see the variant checks below.

For simulator automation, `-NativeUIXInitialTab scrolling` opens this scenario directly.

### Header and content variants

- Choose **Large collapsing** or **Compact fixed**, then scroll to compare native behavior.
- Toggle **Show/Hide subtitle**. On iOS the subtitle is a navigation prompt above the title.
- Tap **Back** or **More**: the result must show `header: back` or `header: more`; this scenario does not navigate.
- Tap Item 3: the result must show `item: row-2`. Item 1 is informational and Item 2 is disabled. Neither emits an action.
- Toggle **Disable actions**: header and actionable list rows must stop emitting events.
- Scroll across sections: the section title sticks below the app bar. Switch away and return to check retained position.

Search, hero imagery, icon actions, arbitrary React content, and hide-on-scroll are deferred.

## Troubleshooting

After a new native component is added to the library, delete `android/build/generated/autolinking` (the cached configuration) and `android/app/build/generated/autolinking` before building Android. Gradle regenerates the autolinking registry only when a lockfile changes, so a stale registry leaves new components on the default shadow node: their native sizes never reach React (lists end under the navigation bar, screens ignore the app bar).
