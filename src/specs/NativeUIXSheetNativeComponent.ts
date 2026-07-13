import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeUIXSheetDetentEvent = Readonly<{detent: string}>;

export interface NativeUIXSheetProps extends ViewProps {
  /** Presented; set to false to animate the sheet away natively. */
  open: boolean;
  /** `medium` and/or `large`. */
  detents?: ReadonlyArray<string>;
  grabber?: CodegenTypes.WithDefault<boolean, true>;
  dismissible?: CodegenTypes.WithDefault<boolean, true>;
  /** The sheet is gone, after its animation, however it was closed. */
  onDismiss?: CodegenTypes.DirectEventHandler<Readonly<{}>>;
  onDetentChange?: CodegenTypes.DirectEventHandler<NativeUIXSheetDetentEvent>;
}

// The host presents the sheet; its one child, NativeUIXSheetContent, is the
// sheet's content area.
export default codegenNativeComponent<NativeUIXSheetProps>(
  'NativeUIXSheet',
) as HostComponent<NativeUIXSheetProps>;
