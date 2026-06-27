import * as React from 'react';
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native';

import NativeUIXTab from '../specs/NativeUIXTabNativeComponent';
import NativeUIXTabs from '../specs/NativeUIXTabsNativeComponent';

export type TabIcon = {
  /** SF Symbol name, for example `house`. */
  ios?: string;
  /**
   * Material icon name from the core set (`Home`, `Settings`, `Search`, …) or
   * the name of a drawable resource in the app.
   */
  android?: string;
};

export type TabProps = {
  id: string;
  title: string;
  icon?: TabIcon;
  /** Badge text, such as a count; omitted or empty shows no badge. */
  badge?: string;
  /**
   * `search`: iOS 18+ shows the system search tab (on iOS 26, a separate
   * button at the trailing end whose field expands in the tab bar, activating
   * the search field of the tab's Stack root). Android shows a regular tab.
   */
  role?: 'default' | 'search';
  children?: React.ReactNode;
};

export type TabsProps = {
  /** Selected tab; omit to let the tab bar keep its own selection. */
  selectedTab?: string;
  /** Tab shown first when `selectedTab` is omitted. Defaults to the first tab. */
  initialTab?: string;
  /** Called when the user selects a tab; the bar has already switched. */
  onTabChange?: (id: string) => void;
  /**
   * Mount a tab's content the first time it is selected, then keep it.
   * Defaults to true, as native tab bar controllers load tabs on demand.
   */
  lazy?: boolean;
  /**
   * How the bar gives way to content while scrolling. iOS 26+: the tab bar
   * minimizes to the selected tab (`automatic` is the system default).
   * Android: the navigation bar slides away (`automatic` keeps it, as
   * Material does by default).
   */
  minimizeBehavior?: 'automatic' | 'never' | 'onScrollDown' | 'onScrollUp';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Experimental app-level tabs: UITabBarController on iOS, a Material 3
 * Expressive navigation bar on Android. Every tab stays mounted, so each
 * tab's Stack keeps its routes and scroll positions.
 */
export function Tabs({
  selectedTab,
  initialTab,
  onTabChange,
  lazy = true,
  minimizeBehavior = 'automatic',
  style,
  children,
}: TabsProps): React.JSX.Element {
  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> => React.isValidElement<TabProps>(child),
  );
  const ids = new Set<string>();
  for (const tab of tabs) {
    if (!tab.props.id || ids.has(tab.props.id)) {
      throw new Error('Tabs: every <Tab> needs a unique, nonempty id.');
    }
    ids.add(tab.props.id);
  }
  const [ownSelection, setOwnSelection] = React.useState(
    () => initialTab ?? tabs[0]?.props.id ?? '',
  );
  const selected = selectedTab ?? ownSelection;
  const visited = React.useRef(new Set<string>()).current;
  visited.add(selected);
  return (
    <NativeUIXTabs
      selectedId={selected}
      minimizeBehavior={minimizeBehavior}
      style={[styles.tabs, style]}
      onTabChange={event => {
        const {id} = event.nativeEvent;
        setOwnSelection(id);
        onTabChange?.(id);
      }}
    >
      {tabs.map(tab => (
        <NativeUIXTab
          key={tab.props.id}
          tabId={tab.props.id}
          title={tab.props.title}
          iosIcon={tab.props.icon?.ios ?? ''}
          androidIcon={tab.props.icon?.android ?? ''}
          badge={tab.props.badge ?? ''}
          tabRole={tab.props.role ?? 'default'}
          collapsable={false}
          style={StyleSheet.absoluteFill}
        >
          {!lazy || visited.has(tab.props.id) ? tab.props.children : null}
        </NativeUIXTab>
      ))}
    </NativeUIXTabs>
  );
}

/** One tab of Tabs; its children fill the tab. */
export function Tab(_props: TabProps): React.JSX.Element | null {
  // Rendered by Tabs, which reads these props.
  return null;
}

const styles = StyleSheet.create({tabs: {flex: 1}});
