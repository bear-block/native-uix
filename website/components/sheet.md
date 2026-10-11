# Sheet

Status: **Experimental**. UIKit sheet presentation on iOS, Material modal bottom
sheet on Android. React supplies content; native code owns dragging and dismissal.

```tsx
<Sheet visible={open} onDismiss={() => setOpen(false)}
  detents={['medium', 'large']} grabber dismissible>
  <View><Text>Sheet content</Text></View>
</Sheet>
```

`detents` defaults to `['large']`; its first value is the opening height.
`grabber` and `dismissible` default to true. `onDetentChange` reports a changed
resting height. Keep `visible` synchronized in `onDismiss`.

Detents are presentation geometry, not filled/outlined appearances. Popovers
and arbitrary full-screen modal contracts are not variants of Sheet. Stack has
separate modal route presentation.

Try Components → Sheet for resizable and locked examples. Gesture, accessibility
and physical-device acceptance must be evaluated for the consuming app.
