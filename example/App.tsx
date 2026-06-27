import * as React from 'react';
import {
  Button,
  ScrollingList,
  SegmentedControl,
  SettingsScreen,
  Stack,
  StackScrollView,
  Switch,
  Tab,
  TabContent,
  TabPage,
  Tabs,
  useStackNavigation,
  useStackSearchText,
  type ScrollingItem,
  type SettingsSection,
  type StackHeader,
  type StackNavigation,
  type StackRoute,
  type StackScreenDefinition,
  type StackScreenProps,
  type TransitionMotion,
} from '@bear-block/native-uix';
import {
  Platform,
  PlatformColor,
  Settings,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type ColorValue,
} from 'react-native';

// The app is native Tabs, each with its own native Stack, so the example also
// shows tab switching, push, pop, swipe-back and predictive back everywhere.

const PLATFORM_LINE =
  Platform.OS === 'ios'
    ? 'UIKit controls, Liquid Glass on iOS 26+'
    : 'Material 3 with dynamic color';

const HOME_ITEMS: ScrollingItem[] = [
  {
    id: 'buttons',
    section: 'Controls',
    title: 'Buttons',
    subtitle: 'Variants, destructive, disabled, native sizing',
    action: true,
  },
  {
    id: 'switches',
    section: 'Controls',
    title: 'Switches',
    subtitle: 'Controlled values, rejected changes',
    action: true,
  },
  {
    id: 'segmented',
    section: 'Controls',
    title: 'Segmented control',
    subtitle: 'Single selection',
    action: true,
  },
  {
    id: 'tabs',
    section: 'Containers',
    title: 'In-screen tabs',
    subtitle: 'TabContent: pages stay mounted; native motion',
    action: true,
  },
  {
    id: 'list',
    section: 'Containers',
    title: 'Scrolling list',
    subtitle: 'Native sectioned list, 80 rows',
    action: true,
  },
  {
    id: 'cover',
    section: 'Navigation',
    title: 'Over the tab bar',
    subtitle: 'hidesTabBar: the tab bar slides away',
    action: true,
  },
  {
    id: 'about',
    section: 'About',
    title: 'Native UIX',
    subtitle: PLATFORM_LINE,
  },
];

function Home({ navigation }: StackScreenProps) {
  // Automated checks on iOS: `-NativeUIXCover 1` pushes over the tab bar after
  // 2 s, then pops 2 s later.
  React.useEffect(() => {
    if (Platform.OS !== 'ios' || !Settings.get('NativeUIXCover')) {
      return;
    }
    const push = setTimeout(() => navigation.push('cover'), 2000);
    const pop = setTimeout(() => navigation.pop(), 4000);
    return () => {
      clearTimeout(push);
      clearTimeout(pop);
    };
  }, [navigation]);
  return (
    <ScrollingList items={HOME_ITEMS} onItemPress={id => navigation.push(id)} />
  );
}

const screens: Record<string, StackScreenDefinition> = {
  home: {
    component: Home,
    header: { title: 'Native UIX', subtitle: PLATFORM_LINE },
  },
  buttons: { component: ButtonsScreen, header: { title: 'Buttons' } },
  switches: { component: SwitchesScreen, header: { title: 'Switches' } },
  segmented: {
    component: SegmentedScreen,
    header: { title: 'Segmented control', size: 'compact' },
  },
  tabs: {
    component: TabsScreen,
    header: { title: 'In-screen tabs', size: 'compact' },
  },
  settings: { component: SettingsDemo, header: { title: 'Settings' } },
  list: {
    component: ListScreen,
    header: {
      title: 'Library',
      subtitle: 'Your reading collection',
      search: { placeholder: 'Search items' },
    },
  },
  item: {
    component: ItemScreen,
    header: route => ({
      title: (route.params as { title: string }).title,
      size: 'compact',
    }),
  },
  navigation: { component: NavigationScreen, header: navigationHeader },
  cover: {
    component: ItemScreen,
    header: { title: 'Over the tab bar', size: 'compact' },
    hidesTabBar: true,
  },
};

// System bars follow the platform theme (light and dark), as in native apps.
export default function App(): React.JSX.Element {
  return (
    <Tabs initialTab={launchTab()} minimizeBehavior="onScrollDown">
      <Tab
        id="components"
        title="Components"
        icon={{ ios: 'square.grid.2x2', android: 'Home' }}
      >
        <Stack screens={screens} initialRoute={{ name: launchRoute() }} />
      </Tab>
      <Tab
        id="navigation"
        title="Navigation"
        icon={{ ios: 'arrow.triangle.branch', android: 'List' }}
      >
        <Stack screens={screens} initialRoute={{ name: 'navigation' }} />
      </Tab>
      <Tab
        id="settings"
        title="Settings"
        icon={{ ios: 'gearshape', android: 'Settings' }}
        badge="2"
      >
        <Stack screens={screens} initialRoute={{ name: 'settings' }} />
      </Tab>
      <Tab id="search" title="Search" role="search">
        <Stack screens={screens} initialRoute={{ name: 'list' }} />
      </Tab>
    </Tabs>
  );
}

// Automated checks on iOS: `-NativeUIXRoute tabs` starts the Components tab on
// that screen; `-NativeUIXTab settings` starts on another tab.
function launchRoute(): string {
  const route = Platform.OS === 'ios' ? Settings.get('NativeUIXRoute') : null;
  return typeof route === 'string' && route in screens ? route : 'home';
}

function launchTab(): string {
  const tab = Platform.OS === 'ios' ? Settings.get('NativeUIXTab') : null;
  return typeof tab === 'string' ? tab : 'components';
}

function useColors() {
  const dark = useColorScheme() === 'dark';
  if (Platform.OS === 'ios') {
    return {
      text: PlatformColor('label'),
      secondary: PlatformColor('secondaryLabel'),
      card: PlatformColor('secondarySystemBackground'),
    };
  }
  return dark
    ? { text: '#e6e1e5', secondary: '#cac4d0', card: '#2b2930' }
    : { text: '#1d1b20', secondary: '#49454f', card: '#f3edf7' };
}

type Colors = { text: ColorValue; secondary: ColorValue; card: ColorValue };

function useLog() {
  const [log, setLog] = React.useState<string[]>([]);
  const record = React.useCallback(
    (line: string) => setLog(previous => [line, ...previous].slice(0, 5)),
    [],
  );
  return [log, record] as const;
}

function ButtonsScreen() {
  const colors = useColors();
  const [log, record] = useLog();
  const [presses, setPresses] = React.useState(0);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <SectionTitle colors={colors}>Variants</SectionTitle>
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
      <SectionTitle colors={colors}>Destructive</SectionTitle>
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
      <SectionTitle colors={colors}>Disabled</SectionTitle>
      <Button
        label="Disabled"
        variant="primary"
        disabled
        style={styles.hug}
        onPress={() => record('Disabled must never fire')}
      />
      <SectionTitle colors={colors}>Native sizing</SectionTitle>
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
      <EventLog colors={colors} log={log} />
    </StackScrollView>
  );
}

function SwitchesScreen() {
  const colors = useColors();
  const [log, record] = useLog();
  const [wifi, setWifi] = React.useState(true);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <SectionTitle colors={colors}>Controlled</SectionTitle>
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
        value={false}
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
      <EventLog colors={colors} log={log} />
    </StackScrollView>
  );
}

function SegmentedScreen() {
  const colors = useColors();
  const [size, setSize] = React.useState('m');
  const [view, setView] = React.useState('list');
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <SectionTitle colors={colors}>Size</SectionTitle>
      <SegmentedControl
        accessibilityLabel="Size"
        segments={[
          { id: 's', label: 'Small' },
          { id: 'm', label: 'Medium' },
          { id: 'l', label: 'Large' },
        ]}
        value={size}
        onValueChange={setSize}
      />
      <SectionTitle colors={colors}>View</SectionTitle>
      <SegmentedControl
        accessibilityLabel="View"
        segments={[
          { id: 'list', label: 'List' },
          { id: 'grid', label: 'Grid' },
        ]}
        value={view}
        onValueChange={setView}
      />
      <Text style={[styles.body, { color: colors.secondary }]}>
        Selected: {size}, {view}
      </Text>
    </StackScrollView>
  );
}

const MOTIONS = [
  { id: 'platform', label: 'Default' },
  { id: 'fadeThrough', label: 'Fade' },
  { id: 'sharedAxisX', label: 'Axis' },
  { id: 'none', label: 'None' },
];

const PAGES = [
  { id: 'first', label: 'First' },
  { id: 'second', label: 'Second' },
  { id: 'third', label: 'Third' },
];

function TabsScreen() {
  const colors = useColors();
  const [page, setPage] = React.useState('first');
  const [motion, setMotion] = React.useState<TransitionMotion>('platform');
  return (
    <View style={styles.flex}>
      <View style={styles.controls}>
        <SegmentedControl
          accessibilityLabel="Page"
          segments={PAGES}
          value={page}
          onValueChange={setPage}
        />
        <SegmentedControl
          accessibilityLabel="Transition"
          segments={MOTIONS}
          value={motion}
          onValueChange={id => setMotion(id as TransitionMotion)}
        />
      </View>
      <TabContent value={page} motion={motion} style={styles.flex}>
        {PAGES.map(item => (
          <TabPage key={item.id} id={item.id}>
            <CounterPage colors={colors} label={item.label} />
          </TabPage>
        ))}
      </TabContent>
    </View>
  );
}

function CounterPage({ colors, label }: { colors: Colors; label: string }) {
  const [count, setCount] = React.useState(0);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>
        {label} page
      </Text>
      <Text style={[styles.body, { color: colors.secondary }]}>
        Pages stay mounted: the count and scroll position survive switching
        pages.
      </Text>
      <Button
        label={`Count (${count})`}
        variant="primary"
        style={styles.hug}
        onPress={() => setCount(c => c + 1)}
      />
      {Array.from({ length: 20 }, (_, index) => (
        <View
          key={index}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <Text style={{ color: colors.text }}>
            {label} row {index + 1}
          </Text>
        </View>
      ))}
    </StackScrollView>
  );
}

function SettingsDemo() {
  const [airplane, setAirplane] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const navigation = useStackNavigation();
  const sections = React.useMemo<SettingsSection[]>(
    () => [
      {
        id: 'connectivity',
        title: 'Connectivity',
        rows: [
          {
            id: 'airplane',
            kind: 'switch',
            label: 'Airplane mode',
            value: airplane,
          },
          {
            id: 'roaming',
            kind: 'switch',
            label: 'Data roaming (locked by admin)',
            value: false,
          },
          {
            id: 'network',
            kind: 'action',
            label: 'Network',
            disabled: airplane,
          },
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
          { id: 'privacy', kind: 'action', label: 'Privacy & security' },
          { id: 'about', kind: 'action', label: 'About' },
        ],
      },
      {
        id: 'many',
        title: '100 rows',
        rows: Array.from({ length: 100 }, (_, index) => ({
          id: `item-${index + 1}`,
          kind: 'action' as const,
          label: `Item ${index + 1}`,
        })),
      },
    ],
    [airplane, notifications],
  );
  return (
    <SettingsScreen
      sections={sections}
      onAction={action => {
        if (action.type === 'press') {
          navigation.push('item', { title: action.rowId });
        } else if (action.rowId === 'airplane') {
          setAirplane(action.value);
        } else if (action.rowId === 'notifications') {
          setNotifications(action.value);
        }
        // Roaming is never accepted: its switch snaps back.
      }}
    />
  );
}

const LIST_ITEMS: ScrollingItem[] = Array.from({ length: 80 }, (_, index) => ({
  id: `row-${index}`,
  title: `Item ${index + 1}`,
  subtitle: index % 3 === 0 ? 'Informational row' : 'Opens a detail screen',
  section: `Section ${Math.floor(index / 10) + 1}`,
  action: index % 3 !== 0,
  disabled: index === 1,
}));

function ListScreen({ navigation }: StackScreenProps) {
  const query = useStackSearchText().trim().toLowerCase();
  const items = React.useMemo(
    () =>
      query === ''
        ? LIST_ITEMS
        : LIST_ITEMS.filter(item => item.title.toLowerCase().includes(query)),
    [query],
  );
  return (
    <ScrollingList
      items={items}
      onItemPress={id =>
        navigation.push('item', {
          title: LIST_ITEMS.find(item => item.id === id)!.title,
        })
      }
    />
  );
}

function ItemScreen({ route }: StackScreenProps) {
  const colors = useColors();
  const title =
    (route.params as { title?: string } | undefined)?.title ?? 'this screen';
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.body, { color: colors.text }]}>
        Detail for {title}. Go back with the back button, an edge swipe on iOS,
        or system back on Android (predictive back on Android 14+).
      </Text>
    </StackScrollView>
  );
}

type NavigationParams = { depth: number } | undefined;

function navigationHeader(
  route: StackRoute,
  navigation: StackNavigation,
): StackHeader {
  const depth = (route.params as NavigationParams)?.depth ?? 1;
  return {
    title: `Level ${depth}`,
    size: depth % 2 === 1 ? 'large' : 'compact',
    trailingAction:
      depth > 1 ? { label: 'Done', onPress: navigation.popToRoot } : undefined,
  };
}

function NavigationScreen({ route, navigation }: StackScreenProps) {
  const colors = useColors();
  const depth = (route.params as NavigationParams)?.depth ?? 1;
  const [count, setCount] = React.useState(0);
  // Automated checks on iOS: `-NativeUIXScript 1` pushes twice, pops, then
  // pops to the root, 2 s apart, so transitions can be recorded.
  React.useEffect(() => {
    if (
      Platform.OS !== 'ios' ||
      depth !== 1 ||
      !Settings.get('NativeUIXScript')
    ) {
      return;
    }
    const steps = [
      () => navigation.push('navigation', { depth: 2 }),
      () => navigation.push('navigation', { depth: 3 }),
      navigation.pop,
      navigation.popToRoot,
    ];
    const timers = steps.map((step, index) =>
      setTimeout(step, 2000 * (index + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [depth, navigation]);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.body, { color: colors.secondary }]}>
        Odd levels use a large title, even levels a compact one. The counter
        survives pushing and coming back.
      </Text>
      <Button
        label={`Count (${count})`}
        style={styles.hug}
        onPress={() => setCount(c => c + 1)}
      />
      <Button
        label={`Push level ${depth + 1}`}
        variant="primary"
        style={styles.fullWidth}
        onPress={() => navigation.push('navigation', { depth: depth + 1 })}
      />
      <View style={styles.row}>
        <Button
          label="Replace"
          style={styles.flex}
          onPress={() => navigation.replace('navigation', { depth })}
        />
        <Button label="Pop" style={styles.flex} onPress={navigation.pop} />
      </View>
      <Button
        label="Pop to root"
        destructive
        style={styles.hug}
        onPress={navigation.popToRoot}
      />
    </StackScrollView>
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
      style={[styles.sectionTitle, { color: colors.secondary }]}
    >
      {children}
    </Text>
  );
}

function EventLog({ colors, log }: { colors: Colors; log: string[] }) {
  return (
    <>
      <SectionTitle colors={colors}>Event log</SectionTitle>
      <View style={[styles.log, { backgroundColor: colors.card }]}>
        {log.length === 0 ? (
          <Text style={{ color: colors.secondary }}>No events yet.</Text>
        ) : (
          log.map((line, index) => (
            <Text
              key={`${index}-${line}`}
              accessibilityLiveRegion={index === 0 ? 'polite' : 'none'}
              style={{ color: index === 0 ? colors.text : colors.secondary }}
            >
              {line}
            </Text>
          ))
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fullWidth: { width: '100%' },
  hug: { alignSelf: 'flex-start' },
  scroll: { gap: 12, padding: 20 },
  controls: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 12 },
  body: { fontSize: 15, lineHeight: 21 },
  pageTitle: { fontSize: 22, fontWeight: '600' },
  card: { borderRadius: 12, padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  log: { borderRadius: 12, gap: 4, padding: 12 },
});
