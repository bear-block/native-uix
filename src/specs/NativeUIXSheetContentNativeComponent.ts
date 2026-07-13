import type {HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export interface NativeUIXSheetContentProps extends ViewProps {}

export default codegenNativeComponent<NativeUIXSheetContentProps>('NativeUIXSheetContent', {
  // Custom C++ shadow node in common/cpp: sized to the presented sheet.
  interfaceOnly: true,
}) as HostComponent<NativeUIXSheetContentProps>;
