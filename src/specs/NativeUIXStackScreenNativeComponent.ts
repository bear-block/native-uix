import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeUIXHeaderActionEvent = Readonly<{id: string}>;
export type NativeUIXSearchEvent = Readonly<{type: string; text: string}>;

export interface NativeUIXStackScreenProps extends ViewProps {
  routeKey: string;
  screenTitle: string;
  headerHidden?: CodegenTypes.WithDefault<boolean, false>;
  hidesTabBar?: CodegenTypes.WithDefault<boolean, false>;
  headerSize?: CodegenTypes.WithDefault<'compact' | 'large', 'large'>;
  headerSubtitle?: string;
  trailingId?: string;
  trailingLabel?: string;
  trailingDisabled?: CodegenTypes.WithDefault<boolean, false>;
  onHeaderAction?: CodegenTypes.DirectEventHandler<NativeUIXHeaderActionEvent>;
  searchEnabled?: CodegenTypes.WithDefault<boolean, false>;
  searchPlaceholder?: string;
  searchPlacement?: CodegenTypes.WithDefault<
    'automatic' | 'integrated' | 'integratedButton' | 'stacked',
    'automatic'
  >;
  searchHidesWhenScrolling?: CodegenTypes.WithDefault<boolean, true>;
  /** `change` while typing, `submit` on the search key, `cancel` when dismissed. */
  onSearch?: CodegenTypes.DirectEventHandler<NativeUIXSearchEvent>;
}

export default codegenNativeComponent<NativeUIXStackScreenProps>(
  'NativeUIXStackScreen',
  // Custom C++ shadow node in common/cpp: sized from native state on Android.
  {interfaceOnly: true},
) as HostComponent<NativeUIXStackScreenProps>;
