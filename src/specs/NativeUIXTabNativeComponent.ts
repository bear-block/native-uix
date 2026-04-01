import type {HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export interface NativeUIXTabProps extends ViewProps {
  tabId: string;
  title: string;
  /** SF Symbol name. */
  iosIcon?: string;
  /** Material icon name (Home, Settings, …) or an app drawable resource name. */
  androidIcon?: string;
  badge?: string;
}

export default codegenNativeComponent<NativeUIXTabProps>(
  'NativeUIXTab',
  // Custom C++ shadow node in common/cpp: sized from native state on Android.
  {interfaceOnly: true},
) as HostComponent<NativeUIXTabProps>;
