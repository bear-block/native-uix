import * as React from 'react';
import {
  Button,
  NativeUIXProvider,
  ScrollingList,
  Form,
  Section,
  type ListAppearances,
  SegmentedControl,
  useStackSearchText,
  type ScrollingItem,
  type StackScreenProps
} from '@bear-block/native-uix';
import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';

const LIST_ITEMS: ScrollingItem[] = Array.from({ length: 80 }, (_, index) => ({
  id: `row-${index}`,
  title: `Item ${index + 1}`,
  subtitle: index % 3 === 0 ? 'Informational row' : 'Opens a detail screen',
  section: `Section ${Math.floor(index / 10) + 1}`,
  action: index % 3 !== 0,
  disabled: index === 1,
}));

export function ListScreen({ navigation }: StackScreenProps) {
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

const LIST_APPEARANCES: ListAppearances[] = Platform.OS === 'ios'
  ? [{ios: 'plain'}, {ios: 'grouped'}, {ios: 'insetGrouped'}]
  : [{android: 'plain'}, {android: 'divided'}];
const appearanceName = (appearance: ListAppearances) => Platform.OS === 'ios' ? appearance.ios! : appearance.android!;
function AppearanceControls({selected, onSelect, defaultIndex, onDefault}: {
  selected: string; onSelect: (id: string) => void; defaultIndex: number; onDefault: () => void;
}) {
  return <View style={listDemoStyles.controls}>
    <SegmentedControl segments={[{id: 'default', label: 'Default'}, ...LIST_APPEARANCES.map(a => ({id: appearanceName(a), label: appearanceName(a)}))]}
      value={selected} onValueChange={onSelect} />
    <Button label={`Change list default (${appearanceName(LIST_APPEARANCES[defaultIndex])})`} onPress={onDefault} />
  </View>;
}
function useListAppearanceDemo() {
  const [selected, setSelected] = React.useState('default');
  const [defaultIndex, setDefaultIndex] = React.useState(LIST_APPEARANCES.length - 1);
  const appearance = selected === 'default' ? undefined : LIST_APPEARANCES.find(a => appearanceName(a) === selected);
  const defaults = LIST_APPEARANCES[defaultIndex];
  return {appearance, defaults, controls: <AppearanceControls selected={selected} onSelect={setSelected}
    defaultIndex={defaultIndex} onDefault={() => setDefaultIndex(i => (i + 1) % LIST_APPEARANCES.length)} />};
}
export function ListAppearancesScreen() {
  const {appearance, defaults, controls} = useListAppearanceDemo();
  const [count, setCount] = React.useState(0);
  return <NativeUIXProvider config={{components: {scrollingList: {appearance: defaults}}}}>
    <View style={listDemoStyles.screen}>{controls}<Text style={listDemoStyles.status}>List presses: {count}</Text>
      <ScrollingList appearance={appearance} items={LIST_ITEMS} onItemPress={() => setCount(n => n + 1)} />
    </View>
  </NativeUIXProvider>;
}
export function FormScreen() {
  const {appearance, defaults, controls} = useListAppearanceDemo();
  const [notifications, setNotifications] = React.useState(true);
  const [count, setCount] = React.useState(0);
  return <NativeUIXProvider config={{components: {form: {appearance: defaults}}}}>
    <View style={listDemoStyles.screen}>{controls}<Text style={listDemoStyles.status}>Form presses: {count}; notifications: {notifications ? 'on' : 'off'}</Text>
      <Form appearance={appearance} onAction={action => {
        if (action.type === 'press') setCount(n => n + 1);
        else if (action.rowId === 'form-notifications') setNotifications(action.value);
      }}>
        <Section id="preferences" title="Preferences" footer="Rejected stays off; Locked cannot change. Values remain when appearance changes."
          rows={[
            {id: 'form-notifications', kind: 'switch', label: 'Form notifications', value: notifications},
            {id: 'form-rejected', kind: 'switch', label: 'Rejected switch', value: false},
            {id: 'form-locked', kind: 'switch', label: 'Locked switch', value: true, disabled: true},
          ]} />
        <Section id="actions" title="Actions" footer="Only enabled actions update the count."
          rows={[{id: 'form-action', kind: 'action', label: 'Form action'},
            {id: 'form-disabled', kind: 'action', label: 'Disabled form action', disabled: true}]} />
        <Section id="more" title="Scroll preservation" footer="End of form"
          rows={Array.from({length: 60}, (_, i) => ({id: `form-row-${i + 1}`, kind: 'action' as const, label: `Form row ${i + 1}`}))} />
      </Form>
    </View>
  </NativeUIXProvider>;
}

const listDemoStyles = StyleSheet.create({controls: {padding: 12, gap: 8}, screen: {flex: 1}, status: {paddingHorizontal: 16}});
