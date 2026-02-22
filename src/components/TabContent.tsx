import * as React from 'react';
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native';

import NativeUIXTabContent from '../specs/NativeUIXTabContentNativeComponent';
import NativeUIXTabPage from '../specs/NativeUIXTabPageNativeComponent';
import type {TransitionMotion} from './TransitionView';

export type TabPageProps = {
  id: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export type TabContentProps = {
  /** ID of the visible page. */
  value: string;
  /**
   * Motion when the visible page changes. `platform` follows the system's
   * tab behavior: no animation on iOS (as `UITabBarController`), Material
   * fade through on Android.
   */
  motion?: TransitionMotion;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Experimental: keeps every page mounted, as native tab containers do, and
 * shows the selected one. Pages keep their state and scroll position; only
 * visibility changes, natively.
 */
export function TabContent({
  value,
  motion = 'platform',
  style,
  children,
}: TabContentProps): React.JSX.Element {
  const ids = React.Children.toArray(children).map(child =>
    React.isValidElement<TabPageProps>(child) ? child.props.id : undefined,
  );
  const seen = new Set<string>();
  for (const id of ids) {
    if (id == null) {
      throw new Error('TabContent: every child must be a <TabPage id="…">');
    }
    if (seen.has(id)) {
      throw new Error(`TabContent: duplicate page id "${id}"`);
    }
    seen.add(id);
  }
  // Keyed by page ID, so a page whose ID changes is a new native page.
  const pages = React.Children.map(children, child =>
    React.isValidElement<TabPageProps>(child)
      ? React.cloneElement(child, {key: child.props.id})
      : child,
  );
  return (
    <NativeUIXTabContent selectedId={value} motion={motion} style={style}>
      {pages}
    </NativeUIXTabContent>
  );
}

/** One page of a TabContent. Fills the container. */
export function TabPage({id, style, children}: TabPageProps): React.JSX.Element {
  return (
    <NativeUIXTabPage
      pageId={id}
      collapsable={false}
      style={[StyleSheet.absoluteFill, style]}>
      {children}
    </NativeUIXTabPage>
  );
}
