import * as React from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

import NativeUIXSwitch, {
  Commands,
} from '../specs/NativeUIXSwitchNativeComponent';

export type SwitchProps = {
  label: string;
  /** Committed value. The native control always returns to it. */
  value: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Called with the value the user asked for; apply it to accept. */
  onValueChange: (requestedValue: boolean) => void;
};

/**
 * Experimental controlled switch. A user toggle only requests a change; if the
 * parent does not commit it, the native control is set back to `value`.
 */
export function Switch({
  value,
  onValueChange,
  style,
  ...props
}: SwitchProps): React.JSX.Element {
  const ref = React.useRef<React.ComponentRef<typeof NativeUIXSwitch>>(null);
  const nativeValue = React.useRef(value);
  const [, forceRender] = React.useReducer((count: number) => count + 1, 0);

  React.useLayoutEffect(() => {
    if (nativeValue.current !== value && ref.current != null) {
      Commands.setNativeValue(ref.current, value);
    }
    nativeValue.current = value;
  });

  return (
    <NativeUIXSwitch
      {...props}
      ref={ref}
      value={value}
      style={style}
      onValueRequest={event => {
        nativeValue.current = event.nativeEvent.value;
        onValueChange(event.nativeEvent.value);
        // Re-render even if the parent rejects, so the layout effect can restore it.
        forceRender();
      }}
    />
  );
}
