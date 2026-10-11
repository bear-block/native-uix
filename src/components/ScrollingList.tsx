import * as React from 'react';
import {useNativeUIXConfig} from '../NativeUIXProvider';
import {resolveListAppearance, type ListAppearances} from '../config';
import {Platform, type StyleProp, type ViewStyle} from 'react-native';

import NativeScrollingList from '../specs/NativeUIXScrollingListNativeComponent';

export type ScrollingItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Rows with the same section are grouped in first-occurrence order. */
  section?: string;
  /** Pressable row with a disclosure indicator; otherwise informational. */
  action?: boolean;
  disabled?: boolean;
};

export type ScrollingListProps = {
  appearance?: ListAppearances;
  items: ReadonlyArray<ScrollingItem>;
  onItemPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Experimental native sectioned list (UITableView on iOS, RecyclerView with
 * Material 3 list items on Android). Native code owns scrolling, so inside a
 * Stack screen the large title collapses with it.
 */
export function ScrollingList({items, onItemPress, style, appearance}: ScrollingListProps): React.JSX.Element {
  const selectedAppearance = resolveListAppearance(Platform.OS === 'ios' ? 'ios' : 'android', 'scrollingList', appearance, useNativeUIXConfig());
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id || ids.has(item.id)) {
      throw new Error('ScrollingList requires unique, nonempty item IDs.');
    }
    ids.add(item.id);
  }
  return (
    <NativeScrollingList
      appearance={selectedAppearance}
      items={items.map(item => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle ?? '',
        section: item.section ?? '',
        action: item.action ?? false,
        disabled: item.disabled ?? false,
      }))}
      onItemPress={event => {
        const {id} = event.nativeEvent;
        if (items.some(item => item.id === id && item.action && !item.disabled)) {
          onItemPress?.(id);
        }
      }}
      style={[{flex: 1}, style]}
    />
  );
}
