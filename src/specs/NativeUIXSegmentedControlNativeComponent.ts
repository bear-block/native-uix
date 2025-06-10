import type * as React from 'react';
import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

export type NativeUIXSelectionRequestEvent = Readonly<{
  index: CodegenTypes.Int32;
}>;


export interface NativeUIXSegmentedControlProps extends ViewProps {
  labels: ReadonlyArray<string>;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, -1>;
  disabled?: CodegenTypes.WithDefault<boolean, false>;
  accessibilityLabel?: string;
  onSelectionRequest?: CodegenTypes.DirectEventHandler<NativeUIXSelectionRequestEvent>;
}

type NativeSegmentedControlType = HostComponent<NativeUIXSegmentedControlProps>;

interface NativeCommands {
  setNativeSelectedIndex: (
    viewRef: React.ComponentRef<NativeSegmentedControlType>,
    index: CodegenTypes.Int32,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeSelectedIndex'],
});

export default codegenNativeComponent<NativeUIXSegmentedControlProps>('NativeUIXSegmentedControl', {
  // Custom C++ shadow node in common/cpp: measured from native state.
  interfaceOnly: true,
}) as NativeSegmentedControlType;
