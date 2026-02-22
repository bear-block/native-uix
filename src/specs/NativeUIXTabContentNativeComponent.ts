import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

export type NativeTabMotion = 'platform' | 'fadeThrough' | 'sharedAxisX' | 'none';

export interface NativeUIXTabContentProps extends ViewProps {
  // Pages are matched by ID: Fabric may reorder native children (zIndex).
  selectedId?: string;
  motion?: CodegenTypes.WithDefault<NativeTabMotion, 'platform'>;
}

export default codegenNativeComponent<NativeUIXTabContentProps>(
  'NativeUIXTabContent',
) as HostComponent<NativeUIXTabContentProps>;
