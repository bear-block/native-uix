import * as React from 'react';
import {Platform, type StyleProp, type ViewStyle} from 'react-native';

import {useNativeUIXConfig} from '../NativeUIXProvider';
import {resolveButtonOptions, type ButtonAppearances, type ButtonSizes} from '../config';
import NativeUIXButton from '../specs/NativeUIXButtonNativeComponent';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  label: string;
  appearance?: ButtonAppearances;
  size?: ButtonSizes;
  /** Visual emphasis. Defaults to the provider value, then `secondary`. */
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
  variant,
  appearance,
  size,
  ...props
}: ButtonProps): React.JSX.Element {
  const config = useNativeUIXConfig();
  const options = resolveButtonOptions(Platform.OS === 'ios' ? 'ios' : 'android', variant, appearance, size, config);
  return (
    <NativeUIXButton
      {...props}
      {...options}
      style={style}
      onButtonPress={() => onPress()}
    />
  );
}
