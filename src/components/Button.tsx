import * as React from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

import NativeUIXButton from '../specs/NativeUIXButtonNativeComponent';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  label: string;
  /** Visual emphasis. Defaults to `secondary`. */
  variant?: ButtonVariant;
  /** Marks a destructive action; combines with either variant. */
  destructive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Outer layout only; the control's appearance stays native. */
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
};

/** Experimental: a platform button (UIKit on iOS, Material 3 on Android). */
export function Button({
  onPress,
  style,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <NativeUIXButton
      {...props}
      style={style}
      onButtonPress={() => onPress()}
    />
  );
}
