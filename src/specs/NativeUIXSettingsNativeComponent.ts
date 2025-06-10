import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/** One flattened descriptor: a section header or a row. */
export type NativeUIXSettingsItem = Readonly<{
  kind: string;
  id: string;
  sectionId: string;
  label: string;
  value: boolean;
  disabled: boolean;
}>;

export type NativeUIXSettingsActionEvent = Readonly<{
  type: string;
  rowId: string;
  value: boolean;
}>;

export interface NativeUIXSettingsProps extends ViewProps {
  screenTitle?: string;
  items: ReadonlyArray<NativeUIXSettingsItem>;
  // Incremented after every native request so rejected requests are reconciled.
  revision?: CodegenTypes.Int32;
  onAction?: CodegenTypes.DirectEventHandler<NativeUIXSettingsActionEvent>;
}

export default codegenNativeComponent<NativeUIXSettingsProps>(
  'NativeUIXSettings',
) as HostComponent<NativeUIXSettingsProps>;
