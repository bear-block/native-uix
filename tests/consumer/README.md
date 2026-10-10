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
the library does not replace the application's delegate.
