# Native UIX example

This React Native CLI app is the interactive acceptance surface for Native UIX. Each implemented capability must have a visible, manually testable scenario here.

## What to check

**Top segmented control**: switching tabs uses the platform's own selection motion.

**Controls tab**

1. Tap **Continue**: the counter increases by exactly one per tap.
2. Tap **Delete**, **Remove**, **Fits** and **Content**: each adds one line to the event log. **Disabled** never does.
3. Long labels wrap inside the screen width; short buttons hug their text.
4. Toggle **Wi-Fi**: the switch animates and the label follows.
5. Toggle **Locked**: the switch animates, then returns to off because the parent rejects the change.

**Settings tab**

1. Toggle **Airplane mode**: the switch animates without the list reloading, and **Network** becomes disabled.
2. Toggle **Data roaming**: it returns to off (rejected by the parent).
3. Tap an action row: the status line shows its row ID. Scroll the 100 rows natively.

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

The iOS app uses a `SceneDelegate`, because iOS 27 terminates apps that do not adopt the UIScene lifecycle.
