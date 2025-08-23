import * as React from 'react';
import {
  Button,
  SegmentedControl,
  SettingsScreen,
  Switch,
  TransitionView,
  type TransitionMotion,
  type SettingsSection,
} from '@bear-block/native-uix';
import {
  Platform,
  ScrollView,
  Settings,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Tab = 'controls' | 'settings';

const MOTIONS = [
  {id: 'fadeThrough', label: 'Fade through'},
  {id: 'sharedAxisX', label: 'Shared axis'},
  {id: 'none', label: 'None'},
];

const TABS = [
  {id: 'controls', label: 'Controls'},
  {id: 'settings', label: 'Settings'},
];

export default function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function AppContent({isDarkMode}: {isDarkMode: boolean}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = React.useState<Tab>('controls');
  const [motion, setMotion] = React.useState<TransitionMotion>('fadeThrough');

  // Automated checks on iOS: launch with `-NativeUIXAutoSwitch 1` to switch
  // tabs every 2.5 s, so transitions can be captured without touch input.
  React.useEffect(() => {
    if (Platform.OS !== 'ios' || !Settings.get('NativeUIXAutoSwitch')) {
      return;
    }
    const timer = setInterval(
      () => setTab(current => (current === 'controls' ? 'settings' : 'controls')),
      2500,
    );
    return () => clearInterval(timer);
  }, []);
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, paddingTop: insets.top},
      ]}>
      <View style={styles.tabs}>
        <SegmentedControl
          accessibilityLabel="Demo section"
          segments={TABS}
          value={tab}
          onValueChange={id => setTab(id as Tab)}
        />
      </View>
      <View style={styles.motion}>
        <SegmentedControl
          accessibilityLabel="Tab transition"
          segments={MOTIONS}
          value={motion}
          onValueChange={id => setMotion(id as TransitionMotion)}
        />
      </View>
      <TransitionView motion={motion} style={styles.flex}>
        {tab === 'controls' ? (
          <ControlsDemo
            key="controls"
            colors={colors}
            bottomInset={insets.bottom}
          />
        ) : (
          <SettingsDemo
            key="settings"
            colors={colors}
            bottomInset={insets.bottom}
          />
        )}
      </TransitionView>
    </View>
  );
}

type Colors = typeof lightColors;

function ControlsDemo({
  colors,
  bottomInset,
}: {
  colors: Colors;
  bottomInset: number;
}) {
  const [log, setLog] = React.useState<string[]>([]);
  const [wifi, setWifi] = React.useState(true);
  const [locked] = React.useState(false);
  const [presses, setPresses] = React.useState(0);
  const record = (line: string) =>
    setLog(previous => [line, ...previous].slice(0, 5));

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        {paddingBottom: bottomInset + 24},
      ]}>
      <Text style={[styles.title, {color: colors.text}]}>Native UIX</Text>
      <Text style={[styles.subtitle, {color: colors.secondary}]}>
        Every control below is the platform's own:{' '}
        {Platform.OS === 'ios'
          ? 'UIKit (Liquid Glass on iOS 26+).'
          : 'Material 3 with dynamic color.'}
      </Text>

      <SectionTitle colors={colors}>Buttons</SectionTitle>
      <Button
        label={`Continue (${presses})`}
        variant="primary"
        style={styles.fullWidth}
        onPress={() => {
          setPresses(count => count + 1);
          record('Continue pressed');
        }}
      />
      <Button
        label="Secondary"
        style={styles.hug}
        onPress={() => record('Secondary pressed')}
      />
      <View style={styles.row}>
        <Button
          label="Delete"
          variant="primary"
          destructive
          style={styles.flex}
          onPress={() => record('Delete pressed')}
        />
        <Button
          label="Remove"
          destructive
          style={styles.flex}
          onPress={() => record('Remove pressed')}
        />
      </View>
      <Button
        label="Disabled"
        variant="primary"
        disabled
        style={styles.hug}
        onPress={() => record('Disabled must never fire')}
      />
      <Button
        label="A long label that wraps onto more than one line to show native sizing"
        onPress={() => record('Long label pressed')}
      />
      <View style={styles.row}>
        <Button label="Fits" onPress={() => record('Fits pressed')} />
        <Button
          label="Content"
          variant="primary"
          onPress={() => record('Content pressed')}
        />
      </View>

      <SectionTitle colors={colors}>Controlled switches</SectionTitle>
      <Switch
        label={`Wi-Fi (${wifi ? 'on' : 'off'})`}
        value={wifi}
        onValueChange={next => {
          setWifi(next);
          record(`Wi-Fi accepted → ${next ? 'on' : 'off'}`);
        }}
      />
      <Switch
        label="Locked: the parent rejects every change"
        value={locked}
        onValueChange={next =>
          record(`Locked rejected ${next ? 'on' : 'off'}; snaps back`)
        }
      />
      <Switch
        label="Disabled"
        value
        disabled
        onValueChange={() => record('Disabled switch must never fire')}
      />

      <SectionTitle colors={colors}>Event log</SectionTitle>
      <View style={[styles.log, {backgroundColor: colors.card}]}>
        {log.length === 0 ? (
          <Text style={{color: colors.secondary}}>No events yet.</Text>
        ) : (
          log.map((line, index) => (
            <Text
              key={`${index}-${line}`}
              accessibilityLiveRegion={index === 0 ? 'polite' : 'none'}
              style={{color: index === 0 ? colors.text : colors.secondary}}>
              {line}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SettingsDemo({
  colors,
  bottomInset,
}: {
  colors: Colors;
  bottomInset: number;
}) {
  const [airplane, setAirplane] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [lastAction, setLastAction] = React.useState('Tap a row');

  const sections = React.useMemo<SettingsSection[]>(
    () => [
      {
        id: 'connectivity',
        title: 'Connectivity',
        rows: [
          {id: 'airplane', kind: 'switch', label: 'Airplane mode', value: airplane},
          {
            id: 'roaming',
            kind: 'switch',
            label: 'Data roaming (locked by admin)',
            value: false,
          },
          {id: 'network', kind: 'action', label: 'Network', disabled: airplane},
        ],
      },
      {
        id: 'general',
        title: 'General',
        rows: [
          {
            id: 'notifications',
            kind: 'switch',
            label: 'Notifications',
            value: notifications,
          },
          {id: 'privacy', kind: 'action', label: 'Privacy & security'},
          {id: 'about', kind: 'action', label: 'About'},
        ],
      },
      {
        id: 'many',
        title: '100 rows',
        rows: Array.from({length: 100}, (_, index) => ({
          id: `item-${index + 1}`,
          kind: 'action' as const,
          label: `Item ${index + 1}`,
        })),
      },
    ],
    [airplane, notifications],
  );

  return (
    <View style={styles.flex}>
      <Text style={[styles.status, {color: colors.secondary}]}>
        {lastAction}
      </Text>
      <SettingsScreen
        title="Settings"
        sections={sections}
        style={{marginBottom: bottomInset}}
        onAction={action => {
          if (action.type === 'press') {
            setLastAction(`Pressed ${action.rowId}`);
            return;
          }
          if (action.rowId === 'airplane') {
            setAirplane(action.value);
          } else if (action.rowId === 'notifications') {
            setNotifications(action.value);
          }
          setLastAction(
            action.rowId === 'roaming'
              ? 'Roaming change rejected; switch snaps back'
              : `${action.rowId} → ${action.value ? 'on' : 'off'}`,
          );
        }}
      />
    </View>
  );
}

function SectionTitle({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: Colors;
}) {
  return (
    <Text
      accessibilityRole="header"
      style={[styles.sectionTitle, {color: colors.secondary}]}>
      {children}
    </Text>
  );
}

const lightColors = {
  background: '#f2f2f7',
  card: '#ffffff',
  text: '#1c1c1e',
  secondary: '#6c6c70',
};

const darkColors = {
  background: '#000000',
  card: '#1c1c1e',
  text: '#f2f2f7',
  secondary: '#a1a1a6',
};

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  tabs: {paddingHorizontal: 16, paddingTop: 8},
  motion: {paddingHorizontal: 16, paddingVertical: 8},
  fullWidth: {width: '100%'},
  hug: {alignSelf: 'flex-start'},
  scroll: {gap: 12, paddingHorizontal: 20, paddingTop: 8},
  title: {fontSize: 34, fontWeight: '700'},
  subtitle: {fontSize: 15, lineHeight: 21},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  row: {flexDirection: 'row', gap: 12},
  log: {borderRadius: 12, gap: 4, padding: 12},
  status: {fontSize: 13, paddingHorizontal: 20, paddingVertical: 4},
});
