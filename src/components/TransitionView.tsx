import * as React from 'react';
import {Platform, type StyleProp, type ViewStyle} from 'react-native';

import NativeUIXTransitionView, {
  Commands,
} from '../specs/NativeUIXTransitionViewNativeComponent';

/**
 * Motion intent; each platform supplies its own motion, never another's.
 * - `platform`: the platform's content change.
 * - `fadeThrough`: switch between unrelated content.
 * - `sharedAxisX`: move forward between related or sequential content.
 * - `none`: no animation.
 *
 * Android uses Material motion (`MaterialFadeThrough` by default,
 * `MaterialSharedAxis` for `sharedAxisX`). UIKit has no equivalent of either,
 * so iOS cross-dissolves for every animated intent; push-style motion belongs
 * to the app's native navigator. The system animator scale (Android) and
 * Reduce Motion (iOS) always win.
 */
export type TransitionMotion = 'platform' | 'fadeThrough' | 'sharedAxisX' | 'none';

export type TransitionViewProps = {
  motion?: TransitionMotion;
  style?: StyleProp<ViewStyle>;
  /** Change the child's `key` to replace it; the old child animates out natively. */
  children?: React.ReactNode;
};

/** Experimental: animates children entering and leaving with native motion. */
export function TransitionView({
  motion = 'platform',
  style,
  children,
}: TransitionViewProps): React.JSX.Element {
  const ref =
    React.useRef<React.ComponentRef<typeof NativeUIXTransitionView>>(null);
  const shown = React.useRef(children);
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);

  // Android: when the child keys change, keep the outgoing children for one
  // more commit and ask native to snapshot them (view commands run before the
  // next mount batch), then render the new children. Fabric tears down an
  // outgoing subtree's descendants before its root, so a later snapshot would
  // be empty. iOS snapshots from the mounting transaction itself.
  const swapPending =
    Platform.OS === 'android' && keysOf(shown.current) !== keysOf(children);
  if (!swapPending) {
    shown.current = children;
  }
  React.useLayoutEffect(() => {
    if (swapPending) {
      if (motion !== 'none' && ref.current != null) {
        Commands.prepareTransition(ref.current);
      }
      shown.current = children;
      rerender();
    }
  });

  return (
    <NativeUIXTransitionView ref={ref} motion={motion} style={style}>
      {swapPending ? shown.current : children}
    </NativeUIXTransitionView>
  );
}

function keysOf(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map(child => (React.isValidElement(child) ? String(child.key) : ''))
    .join('|');
}
