import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeUIXHeaderActionEvent = Readonly<{id: string}>;

export interface NativeUIXStackScreenProps extends ViewProps {
  routeKey: string;
  screenTitle: string;
  headerSize?: CodegenTypes.WithDefault<'compact' | 'large', 'large'>;
  headerSubtitle?: string;
  trailingId?: string;
  trailingLabel?: string;
  trailingDisabled?: CodegenTypes.WithDefault<boolean, false>;
  onHeaderAction?: CodegenTypes.DirectEventHandler<NativeUIXHeaderActionEvent>;
}

export default codegenNativeComponent<NativeUIXStackScreenProps>(
  'NativeUIXStackScreen',
  // Custom C++ shadow node in common/cpp: sized from native state on Android.
  {interfaceOnly: true},
) as HostComponent<NativeUIXStackScreenProps>;
