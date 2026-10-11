# Build for the platform

Native UIX is an experimental React Native library for native application UI
and navigation. Its public package name is `@bear-block/native-uix`.

Your app owns values, business logic and route intent. Native UIX translates its
contracts into UIKit controls on iOS and Material/Android native hosts on Android.
The objective is a platform experience, including behavior, rather than identical
pixels across operating systems.

## Defaults belong to the library

Use a component without appearance props for its documented platform fallback.
Set app defaults through NativeUIXProvider. Override an individual component when
its placement needs a different presentation. The example uses the same defaults
and native implementation available to consumers.

[Configure defaults](../reference/CONFIGURATION.md) or [browse components](../components/index.md).

## Navigation belongs here too

Native UIX owns its experimental Stack, Tabs and Sheet contracts. React Navigation
is not its routing backend. The application still owns authentication, data,
persistence storage and deep-link parameter validation.

## Evaluate before adopting

The package is private and experimental. The verified development setup uses
React Native 0.87.1 and the New Architecture. Build and interact with the example;
there is no supported production version range yet. Web rendering is outside
scope: this website documents native components and reserves a future capture matrix.

[Run the example](getting-started.md) · [Read the current status](../project/status.md)
