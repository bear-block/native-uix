# Run the example

::: warning Experimental checkout
Native UIX is not published for production installation. Evaluate the repository
and its React Native CLI example. Do not treat an npm install command as a release.
:::

## Prerequisites

Use Node 24, the React Native 0.87.1 native toolchain, Xcode/CocoaPods for iOS,
and Android Studio with a configured SDK and JDK for Android. macOS is required
for the iOS build. See [compatibility](../reference/COMPATIBILITY.md) for limits.

## Get the source

```sh
git clone https://github.com/bear-block/native-uix.git
cd native-uix
npm ci
cd example
npm ci
npm start
```

Keep Metro running. In a second terminal, from `native-uix/example`:

::: code-group

```sh [iOS]
cd ios
pod install
cd ..
npm run ios
```

```sh [Android]
npm run android
```

:::

The example depends on the parent library via `file:..`. It supplies the native
binary, Fabric codegen and Metro configuration. The example's iOS SceneDelegate
also adopts the scene lifecycle required by its iOS 27 test setup.

## Start testing

Open Components → Buttons, Text fields, List appearances or Form and sections.
Each screen exposes normal and disabled behavior, plus the states relevant to
that component. The Navigation tab exercises route changes. Settings exposes
controlled switches and actions in a native scrolling list.

## Verify changes

From the repository root:

```sh
npm test
npm run typecheck
```

From `example`:

```sh
npx tsc --noEmit
npm run lint
```

Rebuild the native app after changing Kotlin, Objective-C++, native specs or
native dependencies. A Metro refresh alone cannot apply those changes.

For a standalone consuming app, native linking, codegen and platform setup still
need separate verification. The example build is not universal compatibility.
