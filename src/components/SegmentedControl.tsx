import * as React from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

import NativeUIXSegmentedControl, {
  Commands,
} from '../specs/NativeUIXSegmentedControlNativeComponent';

export type Segment = {id: string; label: string};

export type SegmentedControlProps = {
  segments: Segment[];
  /** Committed selection (a segment ID). The native control returns to it. */
  value: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Called with the segment the user picked; apply it to accept. */
  onValueChange: (id: string) => void;
};

/**
 * Experimental controlled segmented control: `UISegmentedControl` on iOS,
 * Material 3 segmented buttons on Android. Selection motion stays native.
 */
export function SegmentedControl({
  segments,
  value,
  onValueChange,
  style,
  ...props
}: SegmentedControlProps): React.JSX.Element {
  const ids = new Set<string>();
  for (const segment of segments) {
    if (ids.has(segment.id)) {
      throw new Error(`SegmentedControl: duplicate segment id "${segment.id}"`);
    }
    ids.add(segment.id);
  }
  const labels = React.useMemo(
    () => segments.map(segment => segment.label),
    [segments],
  );
  const selectedIndex = segments.findIndex(segment => segment.id === value);

  const ref =
    React.useRef<React.ComponentRef<typeof NativeUIXSegmentedControl>>(null);
  const nativeIndex = React.useRef(selectedIndex);
  const [, forceRender] = React.useReducer((count: number) => count + 1, 0);

  React.useLayoutEffect(() => {
    if (nativeIndex.current !== selectedIndex && ref.current != null) {
      Commands.setNativeSelectedIndex(ref.current, selectedIndex);
    }
    nativeIndex.current = selectedIndex;
  });

  return (
    <NativeUIXSegmentedControl
      {...props}
      ref={ref}
      labels={labels}
      selectedIndex={selectedIndex}
      style={style}
      onSelectionRequest={event => {
        const segment = segments[event.nativeEvent.index];
        if (segment == null) {
          return;
        }
        nativeIndex.current = event.nativeEvent.index;
        onValueChange(segment.id);
        // Re-render even if the parent rejects, so the layout effect can restore it.
        forceRender();
      }}
    />
  );
}
