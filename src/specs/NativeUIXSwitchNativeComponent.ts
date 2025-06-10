import type * as React from 'react';
import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

export type NativeUIXValueRequestEvent = Readonly<{
  value: boolean;
}>;


export interface NativeUIXSwitchProps extends ViewProps {
  label: string;
  value?: CodegenTypes.WithDefault<boolean, false>;
  disabled?: CodegenTypes.WithDefault<boolean, false>;
  accessibilityLabel?: string;
  onValueRequest?: CodegenTypes.DirectEventHandler<NativeUIXValueRequestEvent>;
}

type NativeSwitchType = HostComponent<NativeUIXSwitchProps>;

interface NativeCommands {
  setNativeValue: (
    viewRef: React.ComponentRef<NativeSwitchType>,
    value: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeValue'],
});

export default codegenNativeComponent<NativeUIXSwitchProps>('NativeUIXSwitch', {
  // Custom C++ shadow node in common/cpp: measured from native state.
  interfaceOnly: true,
}) as NativeSwitchType;
