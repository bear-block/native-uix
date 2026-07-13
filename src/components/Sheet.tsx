import * as React from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import NativeUIXSheet from '../specs/NativeUIXSheetNativeComponent';
import NativeUIXSheetContent from '../specs/NativeUIXSheetContentNativeComponent';

export type SheetDetent = 'medium' | 'large';

export type SheetProps = {
  /** Shown; set to false to close it with its native animation. */
  visible: boolean;
  /**
   * The sheet was closed, by the user (drag, tap outside, back) or after
   * `visible` became false; set `visible` to false here.
   */
  onDismiss: () => void;
  /** Heights the sheet rests at; the first is where it opens. Defaults to `['large']`. */
  detents?: ReadonlyArray<SheetDetent>;
  /** Show the grabber (iOS) or drag handle (Android). Defaults to true. */
  grabber?: boolean;
  /** Allow closing by dragging, tapping outside or back. Defaults to true. */
  dismissible?: boolean;
  onDetentChange?: (detent: SheetDetent) => void;
  /** Style of the sheet's content area. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Experimental native sheet: UISheetPresentationController on iOS, a
 * Material 3 modal bottom sheet (BottomSheetBehavior) on Android. Native code
 * runs the presentation, dragging between detents and the dismissal; the
 * content is React. Closing animates natively before `onDismiss`.
 */
export function Sheet({
  visible,
  onDismiss,
  detents = ['large'],
  grabber = true,
  dismissible = true,
  onDetentChange,
  style,
  children,
}: SheetProps): React.JSX.Element | null {
  // Stays mounted while the native sheet animates away after `visible` turns
  // false, and until it reports that it is gone.
  const [mounted, setMounted] = React.useState(visible);
  // Android back asks the native sheet to close; it reports when it is gone.
  const [closing, setClosing] = React.useState(false);
  if (visible && !mounted) {
    setMounted(true);
    setClosing(false);
  }
  const window = useWindowDimensions();
  if (!mounted) {
    return null;
  }
  const sheet = (
    <NativeUIXSheet
      open={visible && !closing}
      detents={detents}
      grabber={grabber}
      dismissible={dismissible}
      onDismiss={() => {
        setMounted(false);
        setClosing(false);
        onDismiss();
      }}
      onDetentChange={event => onDetentChange?.(event.nativeEvent.detent as SheetDetent)}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      {/* Until the native sheet reports its size, lay out at the window's. */}
      <NativeUIXSheetContent
        collapsable={false}
        style={[styles.content, {width: window.width, height: window.height}, style]}
      >
        {children}
      </NativeUIXSheetContent>
    </NativeUIXSheet>
  );
  if (Platform.OS === 'ios') {
    // Presented by UIKit from this view; it takes no space here.
    return sheet;
  }
  // Android: React Native's Modal provides the window, touches and back;
  // the native view inside runs the bottom sheet.
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissible) {
          setClosing(true);
        }
      }}
    >
      {sheet}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {position: 'absolute', left: 0, top: 0},
});
