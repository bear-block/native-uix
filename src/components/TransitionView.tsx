import * as React from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

import NativeUIXTransitionView, {
  Commands,
} from '../specs/NativeUIXTransitionViewNativeComponent';

/**
 * Motion intent; each platform supplies its own motion.
 * - `platform`: the platform's default content change (Material fade through
 *   on Android, cross-dissolve on iOS).
 * - `fadeThrough`: switch between unrelated content.
 * - `sharedAxisX`: move forward between related or sequential content.
 * - `none`: no animation.
 * Reduce Motion (iOS) and the animator scale (Android) always win.
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

  // When the child keys change, keep the outgoing children for one more
  // commit, ask native to snapshot them, then render the new children. Fabric
  // tears down an outgoing subtree's descendants before its root, so a later
  // snapshot would be empty.
  const swapPending = keysOf(shown.current) !== keysOf(children);
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
