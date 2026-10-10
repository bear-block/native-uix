// Used by CI: copied into a new React Native app that installs the packed tarball.
import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  Button,
  parseStackState,
  resolveStackLink,
  type StackState,
  type StackLinkSource,
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
  TransitionView,
  useStackSearchText,
  type StackScreenDefinition,
  type StackScreenProps,
} from '@bear-block/native-uix';

const ITEMS = Array.from({length: 30}, (_, index) => ({
  id: `item-${index}`,
  title: `Item ${index + 1}`,
  section: index < 15 ? 'First' : 'Second',
  action: true,
}));

let savedHistory: StackState | null = null;
let remountStack = () => {};
let deliverLink: ((url: string) => void) | undefined;
const linkSource: StackLinkSource = {
  subscribe(listener) {
    deliverLink = listener;
    return () => { deliverLink = undefined; };
  },
  async getInitialURL() { return null; },
};
const linking = {
  source: linkSource,
  prefixes: ['consumer://'],
  resolve: (path: string) => path === 'detail'
    ? [{name: 'controls'}, {name: 'detail'}] : null,
};

function Controls({navigation}: StackScreenProps) {
  const [on, setOn] = React.useState(true);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState('a');
  return (
    <StackScrollView contentContainerStyle={styles.gap}>
      <Text>Packed consumer app</Text>
      <Button label={`Pressed ${count}`} variant="primary" onPress={() => setCount(c => c + 1)} />
      <Switch label="Enabled" value={on} onValueChange={setOn} />
      <SegmentedControl
        segments={[
          {id: 'a', label: 'A'},
          {id: 'b', label: 'B'},
        ]}
        value={page}
        onValueChange={setPage}
      />
      <TabContent value={page} style={styles.pages}>
        <TabPage id="a">
          <Text>Page A</Text>
        </TabPage>
        <TabPage id="b">
          <Text>Page B</Text>
        </TabPage>
      </TabContent>
      <TransitionView style={styles.pages}>
        <Text key={page}>Transition {page}</Text>
      </TransitionView>
      <Button label="Restore saved history" onPress={() => remountStack()} />
      <Button label="Resolve detail link" onPress={() => deliverLink?.('consumer://detail')} />
      <Button label="Open list" onPress={() => navigation.push('list')} />
      <Button label="Open modal" onPress={() => navigation.push('modal')} />
    </StackScrollView>
  );
}

function List({navigation}: StackScreenProps) {
  const query = useStackSearchText().toLowerCase();
  return (
    <ScrollingList
      items={ITEMS.filter(item => item.title.toLowerCase().includes(query))}
      onItemPress={() => navigation.push('detail')}
    />
  );
}

function Detail() {
  return (
    <StackScrollView>
      <Text>Detail</Text>
      <Button label="Remount restored detail" onPress={() => remountStack()} />
    </StackScrollView>
  );
}

function Settings() {
  const [on, setOn] = React.useState(true);
  return (
    <SettingsScreen
      sections={[
        {
          id: 'a',
          title: 'General',
          rows: [{id: 'n', kind: 'switch', label: 'Notifications', value: on}],
        },
      ]}
      onAction={action => {
        if (action.type === 'valueChange') {
          setOn(action.value);
        }
      }}
    />
  );
}

const screens: Record<string, StackScreenDefinition> = {
  controls: {component: Controls, header: {title: 'Consumer'}},
  list: {component: List, header: {title: 'List', search: {placeholder: 'Search'}}},
  detail: {component: Detail, header: {title: 'Detail', size: 'compact'}, hidesTabBar: true},
  modal: {component: Detail, header: {title: 'Modal', size: 'compact'}, presentation: 'modal'},
  settings: {component: Settings, header: {title: 'Settings'}},
};

export default function App(): React.JSX.Element {
  const [generation, setGeneration] = React.useState(0);
  remountStack = () => setGeneration(value => value + 1);
  const initialState = savedHistory
    ? parseStackState(JSON.stringify(savedHistory), Object.keys(screens)) ?? undefined
    : undefined;
  // Exercise the public pure resolver as well as Stack's subscription path.
  if (!resolveStackLink('consumer://detail', linking)) {
    throw new Error('Packed link resolver failed');
  }
  return (
    <View style={styles.flex}>
      <Tabs minimizeBehavior="onScrollDown" layout="sidebar" accessory={<Text>Accessory</Text>}>
        <Tab id="home" title="Home" icon={{ios: 'house', android: 'Home'}}>
          <Stack key={generation} screens={screens} initialRoute={{name: 'controls'}}
            initialState={initialState} linking={linking}
            onStateChange={state => { savedHistory = state; }} />
        </Tab>
        <Tab id="settings" title="Settings" icon={{ios: 'gearshape', android: 'Settings'}} badge="1">
          <Stack screens={screens} initialRoute={{name: 'settings'}} />
        </Tab>
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  gap: {gap: 12, padding: 16},
  pages: {height: 40},
});
