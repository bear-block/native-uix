# Component defaults

Status: **Experimental**. Place `NativeUIXProvider` above the app's component tree:

```tsx
import {NativeUIXProvider, type NativeUIXConfig} from '@bear-block/native-uix';

const config: NativeUIXConfig = {
  components: {
    textField: {variant: {ios: 'plain', android: 'outlined'}},
    button: {variant: 'secondary', appearance: {ios: 'plain', android: 'text'}, size: {ios: 'large', android: 'small'}},
  },
};

<NativeUIXProvider config={config}><App /></NativeUIXProvider>;
```

The selection order is an explicit component prop, the nearest provider default,
then the library's platform default. A nested provider merges the options it
supplies with its parent, retaining other components and the other platform.
Provider updates affect mounted controls without remounting their native hosts.
`style` remains an explicit outer-frame override; the example supplies no native
border, font or color patches to implement variants.

Currently configurable components:

| Component | Config option | Library default |
| --- | --- | --- |
| TextField | `components.textField.variant` | iOS `plain`, Android `outlined` |
| Button | `components.button.variant`, `.appearance`, `.size` | `secondary` / `automatic`; iOS large, Android small |

Other components retain their existing APIs; they do not yet expose provider
variant defaults. Adding a variant requires a native implementation, a documented
platform mapping and an example for its states. No unsupported variant names are
silently mapped to an unrelated platform appearance in the public typed API.

See [Button](BUTTON.md) for native surfaces and sizes, and [TextField](TEXT-FIELD.md) for the platform variants and capture gallery.
