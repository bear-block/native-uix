# Contributing to Native UIX

The repository contains an experimental library and a React Native CLI validation app in `example/`.

Documentation changes should distinguish existing behavior from proposed behavior. Use English, relative Markdown links within this repository and primary sources for platform claims. API samples must state that they are experimental.

Before introducing implementation, link the relevant feasibility result and define ownership of layout, state, lifecycle, gestures and accessibility. Every new or changed capability must add or update an interactive scenario in `example/` so it can be manually tested. Native changes require both iOS and Android verification or an explicit account of what was not run.

Future package changes must be tested from a packed artifact in an ordinary React Native CLI app, without internal planning material or Expo modules. Native build instructions and release compatibility evidence belong in this public repo.

Native UIX is MIT licensed (see [LICENSE](LICENSE)); contributions are accepted under the same license. Do not import third-party source code until its license and attribution requirements have been reviewed.
