# TextField

Status: **Experimental single-line spike**. Native host: UIKit `UITextField`
on iOS, Material `TextInputLayout` and `TextInputEditText` on Android.

```tsx
const field = React.useRef<TextFieldHandle>(null);
const [text, setText] = React.useState('');
<TextField ref={field} value={text} onChangeText={setText}
  placeholder="Enter text" onSubmit={text => save(text)} />;
```

Import `TextField` and the `TextFieldHandle` type from `@bear-block/native-uix`.
The parent owns `value`. Apply `onChangeText` immediately to accept a committed
edit; leave the value unchanged to reject it. Native editing remains local
while JS processes the event. Revision-checked commands ignore acknowledgements
for older native edits. Programmatic value changes do not emit change callbacks.

`ref.focus()` and `ref.blur()` use the native responder/input-method APIs.
`onFocusChange` reports native focus. Keyboard Done emits `onSubmit(text)` and
blurs. `disabled` prevents editing; `secure` uses native obscured text.
Use a descriptive placeholder; secure input is not persisted or logged by the
library. The example does not log password text.

`label` is the persistent field name. Android uses Material's floating label;
iOS uses a UIKit label above the input. `placeholder` is the input prompt.
`helperText` appears below the input; a nonempty `error` replaces it and enables
the native error presentation. Empty error clears the error. Validation belongs
to the app; these props do not validate text.

With `secure` and `passwordToggle`, a native trailing eye reveals/hides text
locally without changing the JS value or emitting a text-change event. Changes
to `secure`, disabling `passwordToggle`, and remounting return to the configured
obscured state. `passwordToggle` has no effect without `secure`. A disabled field
also disables its eye. iOS supplies Show/Hide password accessibility labels;
Android uses Material's localized password toggle description. Changing mode
during active IME composition is not an accepted contract.

The default frame starts at 56 points/dp (64 dp for Android outlined to
include its floating-label margin), adds 24 points for an iOS label and
28 points/dp for supporting text. Native labels/support are single-line in this
bounded layout; long text and large fonts may require a larger `style.height`.
`style` controls the outer frame.
This is a bounded spike, not intrinsic-height or multiline input support.

During IME composition, the host avoids JS-driven text replacement and only
reports committed text. Android observes commit/finish-composing input commands;
iOS checks marked text. These mechanisms still require native IME acceptance.
Do not assume arbitrary asynchronous validators or formatters preserve cursor
and composition: their update ordering is not an accepted contract yet.

## Variants and defaults

`variant` is a platform selection object. Omit it to use the provider default,
then the library default. For example:

```tsx
<TextField variant={{ios: 'rounded', android: 'filled'}}
  label="Name" value={name} onChangeText={setName} />
```

| Platform | Variant | Native presentation |
| --- | --- | --- |
| iOS | `plain` (library default) | UITextField with `borderStyle = none`, native text and trailing eye; label/support use UIKit labels |
| iOS | `rounded` | UITextField with `borderStyle = roundedRect`; the same label/support and editing contract |
| Android | `outlined` (library default) | Material TextInputLayout outlined box, floating label, supporting/error text and native end icon |
| Android | `filled` | Material filled box with theme surface fill, underline and top corners; the same label/support and editing contract |

These are platform-specific styles, not identical cross-platform skins. A variant
object can override one platform while inheriting the other from config. Setup
and nested default behavior are documented in [Configuration](CONFIGURATION.md).
A grouped form or section is a separate layout concern; `plain` does not create
a table section around itself. The current Android host is Material Views, not
a Compose Expressive TextField, and no additional Expressive-specific input
behavior is claimed.

All variants support normal, focused, disabled, error and secure states. Error
text replaces helper text; the eye and controlled-editing contract do not change
with variant. Example states and native control composition are implemented;
visual accessibility/font/theme acceptance remains incomplete.

## Example and open checks

Open **Components → Text fields** for the variant gallery and accepted edits, Focus/Blur, Reset,
rejected edits, secure and disabled controls. Use Show/Clear error to check
helper/error precedence; test the eye, Use plain/secure input and Remove/Enable
password toggle after typing. Verify text and caret placement after toggling. The gallery includes normal/helper, error, disabled and password samples for
each platform variant. Use alternate/platform defaults changes only the
provider-driven sample; explicit samples retain their variants and typed text.
These named samples are intended for future docs captures; capture automation
and a published gallery are not implemented yet. No React Native TextInput or
third-party input library supplies the field host.

Pending acceptance: composing keyboards (including CJK), autocorrect and paste,
selection ranges under rejection/formatting, delayed JS updates, secure-mode
changes while focused, keyboard insets, screen-reader announcements, dynamic
font sizing, live Android theme changes, teardown while editing, and physical
devices. Multiline, public selection control, input masks, error/helper text,
keyboard-type configuration and form validation are outside this first scope.

## Native references

- [Material TextInputLayout](https://developer.android.com/reference/com/google/android/material/textfield/TextInputLayout): label, supporting text, error and password end icon.
- [UIKit UITextField rightView](https://developer.apple.com/documentation/uikit/uitextfield/rightview): native trailing control.

Reviewed 2026-10-10. These APIs explain implementation choices; executed
acceptance applies only to the recorded candidate builds, not every OS version.
