# Native UIX architecture direction

Status: Proposed · 2026-10-04

The recommended investigation path starts with individual Fabric controls, then evaluates native screen containers. A hybrid renderer is a hypothesis, not an accepted implementation decision.

```mermaid
flowchart TD
  App[React Native application] --> API[Semantic TypeScript API]
  API --> Fabric[Fabric host and generated contracts]
  Fabric --> IOS[UIKit adapter and SwiftUI host]
  Fabric --> Android[Android View adapter and Compose host]
  IOS --> PolicyI[Native presentation and accessibility]
  Android --> PolicyA[Material theme and accessibility]
```

In component mode, React Native owns the outer frame and sibling layout. Native code owns the control's internal layout, input feedback and accessibility. Intrinsic sizing must be validated against Fabric constraints; a platform view's intrinsic size alone is not proof of Yoga interoperability.

In screen mode, React Native supplies the outer frame and semantic data. Native code owns content layout and scrolling. Arbitrary React children are excluded from the first screen experiment; callbacks remain in JavaScript and native events refer to stable action IDs.

Navigation scope update, 2026-10-05: Native UIX will own the navigation host, committed stack, header, native back gestures and screen lifecycle. The application registers screens and requests routes through its TypeScript API, and owns business state and persistence policy. React Navigation is not the planned routing backend. An experimental Stack exists: React declares the routes, the native host (`UINavigationController`; a Compose Material 3 Expressive app bar over a view stack on Android) runs transitions and back, and reports committed native pops once; see [native navigation direction](docs/NAVIGATION.md). The navigator owns the only header; lists such as ScrollingList have none of their own. Capability and adaptation logic remains local until multiple components justify a shared policy module.

Implementation acceptance requires executed builds and lifecycle, sizing, state and accessibility evidence on both platforms. The public API remains experimental until that evidence exists.
