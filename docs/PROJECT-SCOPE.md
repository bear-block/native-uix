# Project scope

Status: Proposed · 2026-10-04

Native UIX targets React Native applications that need platform-native controls and semantic screen patterns without maintaining two application UIs.

## Constraints

- Official identity: Native UIX, `@bear-block/native-uix`.
- React Native CLI integration through normal native builds and autolinking.
- No Expo-specific runtime dependency, directly or transitively.
- Native accessibility and platform interaction behavior take priority over visual parity.
- Measure performance against equivalent RN and native implementations.

## Initial scope

Phase 0 researches and tests Button, Switch and a small Settings screen. Production core components follow only after feasibility gates pass. Phone layouts are the first executable path; tablet, window resizing and accessibility scaling are validation requirements, not claimed features.

Web, desktop, Legacy Architecture, a new router, custom rendering engines, arbitrary React children inside native screen trees, and JavaScript imitation of Liquid Glass are outside the initial scope.

## Meaning of zero-config

Common controls should require no appearance tuning after documented native build prerequisites are satisfied. It does not mean zero native build setup or identical rendering across OS versions.
