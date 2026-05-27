// Used by CI: copied into a new React Native app that installs the packed tarball.
import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';
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
      <Button label="Open list" onPress={() => navigation.push('list')} />
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
  settings: {component: Settings, header: {title: 'Settings'}},
};

export default function App(): React.JSX.Element {
  return (
    <View style={styles.flex}>
      <Tabs minimizeBehavior="onScrollDown">
        <Tab id="home" title="Home" icon={{ios: 'house', android: 'Home'}}>
          <Stack screens={screens} initialRoute={{name: 'controls'}} />
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
