#!/bin/sh
# Uses an already booted, explicitly selected simulator with the example installed.
set -eu
: "${SIMULATOR_UDID:?Set SIMULATOR_UDID to the simulator you want to test}"
artifact_dir=$(mktemp -d /private/tmp/native-uix-ios-startup.XXXXXX)
app_id=org.reactjs.native.example.NativeUIXExample
xcrun simctl terminate "$SIMULATOR_UDID" "$app_id" 2>/dev/null || true
xcrun simctl launch "$SIMULATOR_UDID" "$app_id" -NativeUIXStartupDelayMs 10000
# Give the cached bundle time to render the acceptance-only waiting screen.
sleep 2
xcrun simctl io "$SIMULATOR_UDID" screenshot "$artifact_dir/before.png"
xcrun simctl openurl "$SIMULATOR_UDID" nativeuix://navigation/3
xcrun simctl openurl "$SIMULATOR_UDID" nativeuix://navigation/4
xcrun simctl io "$SIMULATOR_UDID" screenshot "$artifact_dir/after-delivery.png"
sleep 12
xcrun simctl io "$SIMULATOR_UDID" screenshot "$artifact_dir/result.png"
printf 'Inspect screenshots in %s: waiting before/after delivery, then Level 4 with Back and Done.\n' "$artifact_dir"
printf 'This fixture captures results; it does not automatically assert screenshot contents.\n'
