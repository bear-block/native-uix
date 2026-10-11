import {scenarioScreen, NoAdditionalVariants} from './src/shared/scenarios';
import * as React from 'react';
import {
  createMMKV
} from 'react-native-mmkv';
import {
  NativeUIXProvider,
  ScrollingList,
  Stack,
  StackScrollView,
  Tab,
  Tabs,
  parseStackState,
  useTabsAccessoryPlacement,
  type ScrollingItem,
  type StackState,
  type StackLinking,
  type StackScreenDefinition,
  type StackScreenProps
} from '@bear-block/native-uix';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
  Settings,
  Text,
  View
} from 'react-native';
import {useColors, styles} from './src/shared/demo';
import {RestorationContext} from './src/shared/restoration';
import {ButtonsScreen, ButtonVariantScenario, ButtonStateScenario} from './src/screens/buttons';
import {SwitchesScreen, SegmentedScreen} from './src/screens/selection';
import {TabsScreen} from './src/screens/pages';
import {SettingsDemo} from './src/screens/settings';
import {ListScreen, ListAppearancesScreen, FormScreen} from './src/screens/lists';
import {TextFieldsScreen, TextFieldVariantScenario, TextFieldStateScenario} from './src/screens/text-fields';
import {ModalScreen, SheetScreen} from './src/screens/sheets';
import {NavigationScreen, navigationHeader} from './src/screens/navigation';

// The app is native Tabs, each with its own native Stack, so the example also
// shows tab switching, push, pop, swipe-back and predictive back everywhere.

const PLATFORM_LINE =
  Platform.OS === 'ios'
    ? 'UIKit controls, Liquid Glass on iOS 26+'
    : 'Material 3 with dynamic color';

const HOME_ITEMS: ScrollingItem[] = [
  {id: 'buttons', section: 'Controls', title: 'Buttons', subtitle: 'Appearance · size · disabled · native press feedback', action: true},
  {id: 'textfield', section: 'Controls', title: 'Text fields', subtitle: 'Variants · secure entry · focus · supporting text', action: true},
  {id: 'switches', section: 'Controls', title: 'Switches', subtitle: 'Accepted, rejected and disabled value requests', action: true},
  {id: 'segmented', section: 'Controls', title: 'Segmented control', subtitle: 'Controlled selection · native selection feedback', action: true},
  {id: 'listappearances', section: 'Lists and forms', title: 'List appearances', subtitle: 'Platform defaults · explicit variants · scroll retention', action: true},
  {id: 'list', section: 'Lists and forms', title: 'Scrolling list', subtitle: 'Native scrolling · header search · action rows', action: true},
  {id: 'form', section: 'Lists and forms', title: 'Form and sections', subtitle: 'Headers/footer · controlled switches · appearance changes', action: true},
  {id: 'settings', section: 'Lists and forms', title: 'Settings', subtitle: 'Dependent rows · rejected switch · recycled rows', action: true},
  {id: 'tabs', section: 'Containers and presentation', title: 'In-screen tabs', subtitle: 'Mounted pages · retained state · motion policies', action: true},
  {id: 'sheet', section: 'Containers and presentation', title: 'Sheet', subtitle: 'Native detents · drag dismissal · locked presentation', action: true},
  {id: 'navigation', section: 'Navigation behaviors', title: 'Stack and Back', subtitle: 'Push/pop/replace · headers · links · restoration', action: true},
  {id: 'compose', section: 'Navigation behaviors', title: 'Modal route', subtitle: 'Presentation · push inside modal · dismissal', action: true},
  {id: 'fullscreen', section: 'Navigation behaviors', title: 'Full-screen modal', subtitle: 'Full-screen native route presentation', action: true},
  {id: 'cover', section: 'Navigation behaviors', title: 'Over the tab bar', subtitle: 'Tab bar visibility during push and Back', action: true},
  {id: 'about', section: 'Native ownership', title: 'Native UIX', subtitle: 'UIKit / Android native hosts. Performance measurements pending.'},
];

function Home({ navigation }: StackScreenProps) {
  // Automated checks on iOS: `-NativeUIXModal compose` presents that modal
  // after 1.5 s, pushes inside it, pops, then dismisses it, 2 s apart.
  React.useEffect(() => {
    const modal = Platform.OS === 'ios' ? Settings.get('NativeUIXModal') : null;
    if (typeof modal !== 'string') {
      return;
    }
    const steps = [
      () => navigation.push(modal),
      () => navigation.push('item', { title: 'a route inside the modal' }),
      navigation.pop,
      navigation.pop,
    ];
    const timers = steps.map((step, index) =>
      setTimeout(step, 1500 + 2000 * index),
    );
    return () => timers.forEach(clearTimeout);
  }, [navigation]);
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

const scenario = (id: string, title: string, detail: string, component: React.ComponentType<StackScreenProps>) => ({id, title, detail, component});
const ButtonScenarios = scenarioScreen('Button', 'UIButton / MaterialButton; native press feedback and measurement.', [
  scenario('variants', 'Appearance and size', 'One appearance at a time, with size and state samples.', ButtonVariantScenario),
  scenario('states', 'Enabled, disabled, destructive', 'Initial count 0; disabled must never fire.', ButtonStateScenario),
  scenario('behavior', 'Defaults, events and sizing', 'Provider updates, callbacks and long labels.', ButtonsScreen),
]);
const FieldScenarios = scenarioScreen('TextField', 'UITextField / Material TextInputLayout; native keyboard input.', [
  scenario('variants', 'Platform variants', 'One variant at a time; initial value Hello.', TextFieldVariantScenario),
  scenario('states', 'Helper, error, disabled, secure', 'Toggle error; compare committed input states.', TextFieldStateScenario),
  scenario('behavior', 'Focus, rejection and secure changes', 'Focus/blur, rejected edits and password toggle.', TextFieldsScreen),
]);
function groupedScenarios(name: string, native: string, component: React.ComponentType<StackScreenProps>, variants?: React.ComponentType<StackScreenProps>) {
  return scenarioScreen(name, native, [
    scenario('variants', 'Presentation', variants ? 'Platform appearance and provider defaults.' : 'Current presentation scope; no invented variants.', variants ?? NoAdditionalVariants),
    scenario('behavior', 'States and interactions', 'Exercise the component checks; Reset remounts this demo.', component),
  ]);
}
const SwitchScenarios = groupedScenarios('Switch', 'UISwitch / MaterialSwitch; controlled value requests.', SwitchesScreen);
const SegmentScenarios = groupedScenarios('SegmentedControl', 'Native persistent single selection.', SegmentedScreen);
const PageScenarios = groupedScenarios('TabContent', 'Mounted native page hosts and transition policies.', TabsScreen);
const SheetScenarios = groupedScenarios('Sheet', 'Native detents and dismissal.', SheetScreen);
const ListScenarios = groupedScenarios('ScrollingList', 'UITableView / RecyclerView owns scrolling.', ListScreen, ListAppearancesScreen);
const FormScenarios = groupedScenarios('Form', 'Native sectioned action/switch rows.', FormScreen, FormScreen);
const SettingsScenarios = groupedScenarios('Settings', 'Native recycled rows and controlled requests.', SettingsDemo);

const screens: Record<string, StackScreenDefinition> = {
  home: {
    component: Home,
    header: { title: 'Native UIX', subtitle: PLATFORM_LINE },
  },
  listappearances: {component: ListAppearancesScreen, header: {title: 'List appearances', size: 'compact'}},
  form: {component: FormScenarios, header: {title: 'Form and sections', size: 'compact'}},
  textfield: {component: FieldScenarios, header: {title: 'Text fields'}},
  buttons: { component: ButtonScenarios, header: { title: 'Buttons' } },
  switches: { component: SwitchScenarios, header: { title: 'Switches' } },
  segmented: {
    component: SegmentScenarios,
    header: { title: 'Segmented control', size: 'compact' },
  },
  tabs: {
    component: PageScenarios,
    header: { title: 'In-screen tabs', size: 'compact' },
  },
  settings: { component: SettingsScenarios, header: { title: 'Settings' } },
  list: {
    component: ListScenarios,
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
  sheet: {
    component: SheetScenarios,
    header: { title: 'Sheet', size: 'compact' },
  },
  compose: {
    component: ModalScreen,
    presentation: 'modal',
    header: (_route, navigation) => ({
      title: 'New note',
      size: 'compact',
      trailingAction: { label: 'Save', onPress: navigation.pop },
    }),
  },
  fullscreen: {
    component: ModalScreen,
    presentation: 'fullScreenModal',
    header: { title: 'Full screen', size: 'compact' },
  },
  cover: {
    component: ItemScreen,
    header: { title: 'Over the tab bar', size: 'compact' },
    hidesTabBar: true,
  },
};

// System bars follow the platform theme (light and dark), as in native apps.
export default function App({startupDelayMs = 0}: {startupDelayMs?: number}): React.JSX.Element {
  const delay = Math.min(10000, Math.max(0, startupDelayMs));
  const [ready, setReady] = React.useState(delay === 0);
  React.useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  if (!ready) return <Text accessibilityRole="text">Waiting to mount navigation…</Text>;
  return <NativeUIXProvider config={{components: {textField: {variant: {ios: 'plain', android: 'outlined'}}, button: {variant: 'secondary'}}}}><ExampleNavigation /></NativeUIXProvider>;
}

function ExampleNavigation(): React.JSX.Element {
  const [selectedTab, setSelectedTab] = React.useState(launchTab);
  React.useEffect(() => {
    try { navigationStorage.set('selected-tab.v1', selectedTab); }
    catch (error) { console.warn('Tab save failed', error); }
  }, [selectedTab]);
  const showNavigation = React.useCallback(() => setSelectedTab('navigation'), []);
  return (
    <Tabs
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
      lazy={false}
      minimizeBehavior="onScrollDown"
      layout="sidebar"
      accessory={<NowPlaying />}
    >
      <Tab
        id="components"
        title="Components"
        icon={{ ios: 'square.grid.2x2', android: 'Home' }}
      >
        <RestorableStack id="components" initialRoute={launchRoute()} />
      </Tab>
      <Tab
        id="navigation"
        title="Navigation"
        icon={{ ios: 'arrow.triangle.branch', android: 'List' }}
      >
        <RestorableStack id="navigation" initialRoute="navigation" onOpen={showNavigation} />
      </Tab>
      <Tab
        id="settings"
        title="Settings"
        icon={{ ios: 'gearshape', android: 'Settings' }}
        badge="2"
      >
        <RestorableStack id="settings" initialRoute="settings" />
      </Tab>
      <Tab id="search" title="Search" role="search">
        <RestorableStack id="search" initialRoute="list" />
      </Tab>
    </Tabs>
  );
}

const TAB_IDS = ['components', 'navigation', 'settings', 'search'];
const stackStorageKey = (id: string) => `stack.${id}.v1`;
const navigationStorage = createMMKV({id: 'native-uix-example.navigation'});
const iosLinkModule = Platform.OS === 'ios' ? NativeModules.NativeUIXExampleLinks : null;
const iosLinkEmitter = iosLinkModule ? new NativeEventEmitter(iosLinkModule) : null;
const navigationLinking: StackLinking = {
  source: iosLinkEmitter ? {
    subscribe: listener => {
      const subscription = iosLinkEmitter.addListener('url', (...args: readonly Object[]) => {
        const event = args[0] as {url?: unknown} | undefined;
        if (typeof event?.url === 'string') listener(event.url);
      });
      return () => subscription.remove();
    },
    getInitialURL: () => iosLinkModule.consumeInitialURL() as Promise<string | null>,
  } : undefined,
  prefixes: ['nativeuix://'],
  resolve: path => {
    const match = /^navigation\/([1-9]\d?)$/.exec(path);
    if (!match) return null;
    const depth = Number(match[1]);
    if (depth > 20) return null;
    return Array.from({length: depth}, (_, index) => ({
      name: 'navigation', params: {depth: index + 1},
    }));
  },
};

function readNavigationState(id: string): StackState | undefined {
  try {
    const json = navigationStorage.getString(stackStorageKey(id));
    const state = json ? parseStackState(json, Object.keys(screens)) : null;
    if (!state || state.routes.some(route => {
      if (route.name === 'navigation') {
        const depth = (route.params as {depth?: number} | undefined)?.depth;
        return depth !== undefined && (!Number.isSafeInteger(depth) || depth < 1);
      }
      if (route.name === 'item') {
        return typeof (route.params as {title?: unknown} | undefined)?.title !== 'string';
      }
      return false;
    })) return undefined;
    return state;
  } catch (error) {
    console.warn('Navigation restore failed', error);
    return undefined;
  }
}

function RestorableStack({id, initialRoute, onOpen}: {
  id: string; initialRoute: string; onOpen?: () => void;
}) {
  const [initialState, setInitialState] = React.useState(() => readNavigationState(id));
  const [generation, setGeneration] = React.useState(0);
  const linking = React.useMemo(() => ({...navigationLinking,
    handleInitialURL: Platform.OS === 'ios' || generation === 0,
  }), [generation]);
  const persist = React.useCallback((state: StackState) => {
    try { navigationStorage.set(stackStorageKey(id), JSON.stringify(state)); }
    catch (error) { console.warn('Navigation save failed', error); }
  }, [id]);
  const restore = React.useCallback(() => {
    const state = readNavigationState(id);
    if (state) { setInitialState(state); setGeneration(value => value + 1); }
  }, [id]);
  return (
    <RestorationContext.Provider value={restore}>
      <Stack key={generation} screens={screens} initialRoute={{name: initialRoute}}
        initialState={initialState} onStateChange={persist}
        linking={id === 'navigation' ? linking : undefined} onLinkHandled={onOpen} />
    </RestorationContext.Provider>
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
  if (typeof tab === 'string' && TAB_IDS.includes(tab)) return tab;
  try {
    const saved = navigationStorage.getString('selected-tab.v1');
    return saved && TAB_IDS.includes(saved) ? saved : 'components';
  } catch { return 'components'; }
}

// The Tabs accessory: a mini player, shown on every tab. Inline (beside the
// minimized iOS tab bar) it drops the subtitle.
function NowPlaying() {
  const colors = useColors();
  const placement = useTabsAccessoryPlacement();
  const [playing, setPlaying] = React.useState(false);
  return (
    <View style={styles.accessory}>
      <View style={styles.artwork} />
      <View style={styles.flex}>
        <Text
          numberOfLines={1}
          style={[styles.accessoryTitle, { color: colors.text }]}
        >
          Native Sounds
        </Text>
        {placement === 'regular' ? (
          <Text
            numberOfLines={1}
            style={[styles.accessorySubtitle, { color: colors.secondary }]}
          >
            Tabs accessory
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => setPlaying(value => !value)}
      >
        <Text style={[styles.accessoryAction, { color: colors.text }]}>
          {playing ? 'Pause' : 'Play'}
        </Text>
      </Pressable>
    </View>
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
