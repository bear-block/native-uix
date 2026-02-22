import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeScrollingItem = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  section: string;
  action: boolean;
  disabled: boolean;
}>;

export interface NativeProps extends ViewProps {
  items: ReadonlyArray<NativeScrollingItem>;
  onItemPress?: CodegenTypes.DirectEventHandler<Readonly<{id: string}>>;
}

export default codegenNativeComponent<NativeProps>(
  'NativeUIXScrollingList',
) as HostComponent<NativeProps>;
