import type * as React from 'react';
import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

export type NativeTransitionMotion =
  | 'platform'
  | 'fadeThrough'
  | 'sharedAxisX'
  | 'none';

export interface NativeUIXTransitionViewProps extends ViewProps {
  motion?: CodegenTypes.WithDefault<NativeTransitionMotion, 'platform'>;
}

type NativeTransitionViewType = HostComponent<NativeUIXTransitionViewProps>;

interface NativeCommands {
  // Snapshot current children before Fabric tears down the outgoing subtree.
  prepareTransition: (viewRef: React.ComponentRef<NativeTransitionViewType>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['prepareTransition'],
});

export default codegenNativeComponent<NativeUIXTransitionViewProps>(
  'NativeUIXTransitionView',
) as NativeTransitionViewType;
