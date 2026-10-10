# Packed consumer fixture

CI copies `App.tsx` into a fresh React Native CLI application after installing
an npm tarball of Native UIX. It must resolve the package from that application's
`node_modules`, without a link to the library checkout.

The fixture includes an in-memory route snapshot and app-owned `StackLinkSource`:

1. Press **Resolve detail link**. The history becomes Controls → Detail.
2. Press **Remount restored detail**. Detail and its native Back button should remain.
3. Press Back. Controls should appear.
4. Open List, then use native Back to return to Controls.

The source emits a synthetic URL through the same subscription contract as a
host-owned native inbox. It does not exercise operating-system URL registration.
The snapshot is intentionally held in memory: remount restoration is covered;
process-restart persistence is exercised by the example app instead.

The Android CI job builds this fixture but does not drive these interactions.
An iOS 27 consumer must adopt the UIScene lifecycle in its application host;
the preparation script below adapts the pinned CLI template. The library does
not replace the application's delegate.

## iOS UI regression

`NavigationUITests.swift` drives the same sequence on a simulator, including
three remounts and a native Back interaction. It checks rendered content and
hittable navigation controls rather than only the JavaScript snapshot.

Prepare a standalone app named `NUXConsumer`, install the packed library, copy
`App.tsx` to its root, and install its pods first. The preparation script also adapts the generated
host to the UIScene lifecycle. Use a Ruby environment with the
`xcodeproj` gem (a CocoaPods dependency) available:

```sh
ruby /absolute/path/to/native-uix/tests/consumer/prepare-ios-ui-tests.rb /absolute/path/to/consumer/ios
```

The script adds or updates a UI-test target and shared scheme in that isolated
consumer only. It can be run again without creating duplicate targets. Run from
the consumer's `ios` directory, replacing the destination with the intended
already booted simulator UDID:

```sh
xcodebuild -workspace NUXConsumer.xcworkspace -scheme NativeUIXPackedUITests -configuration Release -destination 'platform=iOS Simulator,id=SIMULATOR_UDID' -parallel-testing-enabled NO -test-timeouts-enabled YES -default-test-execution-time-allowance 90 -collect-test-diagnostics never test CODE_SIGNING_ALLOWED=NO
```

The timeout bounds each test; disabling verbose diagnostics avoids collecting a
full simulator sysdiagnose on failure. XCTest still records assertions in its
result bundle.

Release embeds the JavaScript bundle and does not need Metro. This test does not
cover interactive gesture cancellation, operating-system URL registration,
physical hardware, or persistent state across process restarts.

The `packed-consumer-ios` CI job creates a fresh app, installs the tarball,
prepares the scene host and test target, and executes this Release test on one
available iPhone simulator. It uploads the result bundle and build/test log
even on failure. The runtime selected on the hosted runner is printed in the
job log; a passing run establishes only that recorded environment.
