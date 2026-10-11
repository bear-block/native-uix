import type * as React from 'react';
import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';
export interface NativeUIXTextFieldProps extends ViewProps {
  variant?: CodegenTypes.WithDefault<'plain' | 'rounded' | 'filled' | 'outlined', 'plain'>;
  value: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  passwordToggle?: CodegenTypes.WithDefault<boolean, false>;
  disabled?: CodegenTypes.WithDefault<boolean, false>;
  secure?: CodegenTypes.WithDefault<boolean, false>;
  onTextChange?: CodegenTypes.DirectEventHandler<Readonly<{text: string; eventCount: CodegenTypes.Int32}>>;
  onFieldFocus?: CodegenTypes.DirectEventHandler<Readonly<{focused: boolean}>>;
  onFieldSubmit?: CodegenTypes.DirectEventHandler<Readonly<{text: string}>>;
}
type NativeField = HostComponent<NativeUIXTextFieldProps>;
interface NativeCommands {
  reconcile: (viewRef: React.ComponentRef<NativeField>, value: string, eventCount: CodegenTypes.Int32) => void;
  focus: (viewRef: React.ComponentRef<NativeField>) => void;
  blur: (viewRef: React.ComponentRef<NativeField>) => void;
}
export const Commands = codegenNativeCommands<NativeCommands>({supportedCommands: ['reconcile', 'focus', 'blur']});
export default codegenNativeComponent<NativeUIXTextFieldProps>('NativeUIXTextField') as NativeField;
