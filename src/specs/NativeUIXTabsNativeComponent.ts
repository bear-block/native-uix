import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeUIXTabChangeEvent = Readonly<{id: string}>;

export interface NativeUIXTabsProps extends ViewProps {
  /** ID of the selected tab. */
  selectedId: string;
  minimizeBehavior?: CodegenTypes.WithDefault<'automatic' | 'never' | 'onScrollDown' | 'onScrollUp', 'automatic'>;
  onTabChange?: CodegenTypes.DirectEventHandler<NativeUIXTabChangeEvent>;
}

export default codegenNativeComponent<NativeUIXTabsProps>(
  'NativeUIXTabs',
) as HostComponent<NativeUIXTabsProps>;
