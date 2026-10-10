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

The initial layout height is 56 points/dp; `style` controls the outer frame.
This is a bounded spike, not intrinsic-height or multiline input support.

During IME composition, the host avoids JS-driven text replacement and only
reports committed text. Android observes commit/finish-composing input commands;
iOS checks marked text. These mechanisms still require native IME acceptance.
Do not assume arbitrary asynchronous validators or formatters preserve cursor
and composition: their update ordering is not an accepted contract yet.

## Example and open checks

Open **Components → Text fields** for accepted edits, Focus/Blur, Reset,
rejected edits, secure and disabled controls. No React Native TextInput or
third-party input library supplies the field host.

Pending acceptance: composing keyboards (including CJK), autocorrect and paste,
selection ranges under rejection/formatting, delayed JS updates, secure-mode
changes while focused, keyboard insets, screen-reader announcements, dynamic
font sizing, live Android theme changes, teardown while editing, and physical
devices. Multiline, public selection control, input masks, error/helper text,
keyboard-type configuration and form validation are outside this first scope.
