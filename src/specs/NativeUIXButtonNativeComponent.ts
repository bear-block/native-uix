import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeButtonVariant = 'primary' | 'secondary';

export type NativeUIXPressEvent = Readonly<{
  timestamp: CodegenTypes.Double;
}>;


export interface NativeUIXButtonProps extends ViewProps {
  label: string;
  appearance?: CodegenTypes.WithDefault<'automatic' | 'plain' | 'gray' | 'tinted' | 'filled' | 'borderless' | 'bordered' | 'borderedTinted' | 'borderedProminent' | 'glass' | 'prominentGlass' | 'clearGlass' | 'prominentClearGlass' | 'tonal' | 'outlined' | 'text' | 'elevated', 'automatic'>;
  size?: CodegenTypes.WithDefault<'mini' | 'small' | 'medium' | 'large', 'large'>;
  variant?: CodegenTypes.WithDefault<NativeButtonVariant, 'secondary'>;
  destructive?: CodegenTypes.WithDefault<boolean, false>;
  disabled?: CodegenTypes.WithDefault<boolean, false>;
  accessibilityLabel?: string;
  onButtonPress?: CodegenTypes.DirectEventHandler<NativeUIXPressEvent>;
}

export default codegenNativeComponent<NativeUIXButtonProps>('NativeUIXButton', {
  // Custom C++ shadow node in common/cpp: measured from native state.
  interfaceOnly: true,
}) as HostComponent<NativeUIXButtonProps>;
