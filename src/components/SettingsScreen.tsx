import * as React from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

import NativeUIXSettings from '../specs/NativeUIXSettingsNativeComponent';
import {
  flattenSettings,
  toSettingsAction,
  type SettingsAction,
  type SettingsSection,
} from './settingsModel';

export type SettingsScreenProps = {
  title?: string;
  sections: SettingsSection[];
  /** Outer frame; the screen scrolls natively inside it. */
  style?: StyleProp<ViewStyle>;
  onAction: (action: SettingsAction) => void;
};

/**
 * Experimental native settings list (inset grouped table on iOS, Material 3
 * list on Android). Rows are descriptors; callbacks never cross to native.
 */
export function SettingsScreen({
  title,
  sections,
  style,
  onAction,
}: SettingsScreenProps): React.JSX.Element {
  const items = React.useMemo(() => flattenSettings(sections), [sections]);
  const [revision, bumpRevision] = React.useReducer((n: number) => n + 1, 0);
  return (
    <NativeUIXSettings
      screenTitle={title}
      items={items}
      revision={revision}
      style={[{flex: 1}, style]}
      onAction={event => {
        const action = toSettingsAction(event.nativeEvent);
        if (action != null) {
          onAction(action);
        }
        // A new revision makes native re-apply the committed descriptors,
        // which restores a switch whose request was rejected.
        bumpRevision();
      }}
    />
  );
}
