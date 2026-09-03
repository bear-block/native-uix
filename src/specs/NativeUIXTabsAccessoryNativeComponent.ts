import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeUIXAccessoryPlacementEvent = Readonly<{placement: string}>;

export interface NativeUIXTabsAccessoryProps extends ViewProps {
  /** `regular` above the tab bar, `inline` beside the minimized bar (iOS 26+). */
  onPlacementChange?: CodegenTypes.DirectEventHandler<NativeUIXAccessoryPlacementEvent>;
}

export default codegenNativeComponent<NativeUIXTabsAccessoryProps>('NativeUIXTabsAccessory', {
  // Custom C++ shadow node in common/cpp: sized to the native accessory.
  interfaceOnly: true,
}) as HostComponent<NativeUIXTabsAccessoryProps>;
