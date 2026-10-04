import * as React from 'react';
import {StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle} from 'react-native';

import NativeUIXTab from '../specs/NativeUIXTabNativeComponent';
import NativeUIXTabs from '../specs/NativeUIXTabsNativeComponent';
import NativeUIXTabsAccessory from '../specs/NativeUIXTabsAccessoryNativeComponent';

export type TabsAccessoryPlacement = 'regular' | 'inline';

const AccessoryPlacementContext = React.createContext<TabsAccessoryPlacement>('regular');

/**
 * Where the Tabs accessory is shown: `regular` above the tab bar, or `inline`
 * beside the minimized tab bar (iOS 26+), where it is smaller; lay the
 * content out for it. Always `regular` on Android.
 */
export function useTabsAccessoryPlacement(): TabsAccessoryPlacement {
  return React.useContext(AccessoryPlacementContext);
}

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
  /**
   * Content shown with the tab bar on every tab, such as a mini player. iOS
   * 26+: the tab bar's bottom accessory (Liquid Glass), which moves inline
   * when the bar minimizes; earlier iOS shows nothing. Android: a floating
   * Material surface above the navigation bar that stays when the bar slides
   * away. Hidden with the bar under routes that cover it.
   */
  accessory?: React.ReactNode;
  /**
   * How the tabs adapt to wide windows. `automatic`: iOS decides (a floating
   * tab bar on iPad, with a sidebar button when available); Android shows a
   * navigation rail from 600 dp wide. `sidebar`: iPad (iOS 18+) shows the
   * tabs in a sidebar, which can collapse to the tab bar; Android as
   * `automatic`. `tabBar`: always the bar.
   */
  layout?: 'automatic' | 'tabBar' | 'sidebar';
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
  accessory,
  layout = 'automatic',
  style,
  children,
}: TabsProps): React.JSX.Element {
  const [placement, setPlacement] = React.useState<TabsAccessoryPlacement>('regular');
  const window = useWindowDimensions();
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
      tabsLayout={layout}
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
      {/* After the tabs, so tab indices match on both sides. */}
      {accessory != null ? (
        <NativeUIXTabsAccessory
          key="accessory"
          collapsable={false}
          onPlacementChange={event =>
            setPlacement(event.nativeEvent.placement === 'inline' ? 'inline' : 'regular')
          }
          // Until the platform reports the accessory's size.
          style={[styles.accessory, {width: window.width}]}
        >
          <AccessoryPlacementContext.Provider value={placement}>{accessory}</AccessoryPlacementContext.Provider>
        </NativeUIXTabsAccessory>
      ) : null}
    </NativeUIXTabs>
  );
}

/** One tab of Tabs; its children fill the tab. */
export function Tab(_props: TabProps): React.JSX.Element | null {
  // Rendered by Tabs, which reads these props.
  return null;
}

const styles = StyleSheet.create({
  tabs: {flex: 1},
  accessory: {position: 'absolute', left: 0, top: 0, height: 48},
});
