import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeUIXStackPopEvent = Readonly<{
  /** Route that is on top after a pop the native stack already committed. */
  topKey: string;
}>;

export interface NativeUIXStackProps extends ViewProps {
  onNativePop?: CodegenTypes.DirectEventHandler<NativeUIXStackPopEvent>;
}

export default codegenNativeComponent<NativeUIXStackProps>(
  'NativeUIXStack',
) as HostComponent<NativeUIXStackProps>;
