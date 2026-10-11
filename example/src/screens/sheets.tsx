import * as React from 'react';
import {
  Button,
  Sheet,
  StackScrollView,
  type StackScreenProps
} from '@bear-block/native-uix';
import {
  Platform,
  Settings,
  Text,
  View
} from 'react-native';
import {BehaviorGuide, useColors, useLog, EventLog, styles, type Colors} from '../shared/demo';

export function ModalScreen({ navigation }: StackScreenProps) {
  const colors = useColors();
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <BehaviorGuide native="UIKit presentation / Android Material bottom sheet and native route hosts." checks="Drag between detents; dismiss; try locked dismissal and Back. Modal routes are separate from Sheet." />
      <Text style={[styles.body, { color: colors.text }]}>
        {Platform.OS === 'ios'
          ? 'A new navigation controller presented over the app. Close it with the close button, by swiping the sheet down, or with Save.'
          : 'A Material full-screen dialog: it rises over the app and the navigation bar. Close it with the close button, system back, or Save.'}
      </Text>
      <Text style={[styles.body, { color: colors.secondary }]}>
        Routes pushed from here stack inside the modal.
      </Text>
      <Button
        label="Push inside the modal"
        variant="primary"
        style={styles.fullWidth}
        onPress={() =>
          navigation.push('item', { title: 'a route inside the modal' })
        }
      />
      <Button label="Close" style={styles.hug} onPress={navigation.pop} />
    </StackScrollView>
  );
}

export function SheetScreen() {
  const colors = useColors();
  const [open, setOpen] = React.useState<'none' | 'resizable' | 'locked'>(
    'none',
  );
  const [log, record] = useLog();
  // Automated checks on iOS: `-NativeUIXRoute sheet -NativeUIXSheet 1` opens
  // the resizable sheet after 1.5 s.
  React.useEffect(() => {
    if (Platform.OS !== 'ios' || !Settings.get('NativeUIXSheet')) {
      return;
    }
    const timer = setTimeout(() => setOpen('resizable'), 1500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.body, { color: colors.secondary }]}>
        The platform runs the sheet: drag between heights, drag down or tap
        outside to close (iOS swipe, Android scrim and back).
      </Text>
      <Button
        label="Medium and large"
        variant="primary"
        style={styles.fullWidth}
        onPress={() => setOpen('resizable')}
      />
      <Button
        label="Large, closes only with its button"
        style={styles.fullWidth}
        onPress={() => setOpen('locked')}
      />
      <EventLog colors={colors} log={log} />
      <Sheet
        visible={open === 'resizable'}
        detents={['medium', 'large']}
        onDetentChange={detent => record(`Detent: ${detent}`)}
        onDismiss={() => {
          setOpen('none');
          record('Dismissed');
        }}
      >
        <SheetContent colors={colors} title="Resizable sheet" />
      </Sheet>
      <Sheet
        visible={open === 'locked'}
        dismissible={false}
        onDismiss={() => {
          setOpen('none');
          record('Closed with its button');
        }}
      >
        <SheetContent
          colors={colors}
          title="Locked sheet"
          onClose={() => setOpen('none')}
        />
      </Sheet>
    </StackScrollView>
  );
}

function SheetContent({
  colors,
  title,
  onClose,
}: {
  colors: Colors;
  title: string;
  onClose?: () => void;
}) {
  const [count, setCount] = React.useState(0);
  return (
    <View style={[styles.scroll, styles.flex]}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.secondary }]}>
        React content inside a native sheet.
      </Text>
      <Button
        label={`Count (${count})`}
        style={styles.hug}
        onPress={() => setCount(c => c + 1)}
      />
      {onClose ? (
        <Button
          label="Close"
          variant="primary"
          style={styles.fullWidth}
          onPress={onClose}
        />
      ) : null}
    </View>
  );
}

