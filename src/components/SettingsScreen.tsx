import * as React from 'react';
import {useNativeUIXConfig} from '../NativeUIXProvider';
import {resolveListAppearance, type ListAppearances} from '../config';
import {Platform, type StyleProp, type ViewStyle} from 'react-native';

import NativeUIXSettings from '../specs/NativeUIXSettingsNativeComponent';
import {
  flattenSettings,
  toSettingsAction,
  type SettingsAction,
  type SettingsSection,
} from './settingsModel';

export type SettingsScreenProps = {
  appearance?: ListAppearances;
  title?: string;
  sections: SettingsSection[];
  /** Outer frame; the screen scrolls natively inside it. */
  style?: StyleProp<ViewStyle>;
  onAction: (action: SettingsAction) => void;
};

/**
 * Experimental native settings list (platform table styles on iOS, Material 3
 * list on Android). Rows are descriptors; callbacks never cross to native.
 */
export function SettingsScreen({
  title,
  appearance,
  sections,
  style,
  onAction,
}: SettingsScreenProps): React.JSX.Element {
  const selectedAppearance = resolveListAppearance(Platform.OS === 'ios' ? 'ios' : 'android', 'settingsScreen', appearance, useNativeUIXConfig());
  const items = React.useMemo(() => flattenSettings(sections), [sections]);
  const [revision, bumpRevision] = React.useReducer((n: number) => n + 1, 0);
  return (
    <NativeUIXSettings
      appearance={selectedAppearance}
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
