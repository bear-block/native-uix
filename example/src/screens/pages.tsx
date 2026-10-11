import * as React from 'react';
import {
  Button,
  SegmentedControl,
  StackScrollView,
  TabContent,
  TabPage,
  type TransitionMotion
} from '@bear-block/native-uix';
import {
  Text,
  View
} from 'react-native';
import {BehaviorGuide, useColors, styles, type Colors} from '../shared/demo';

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

export function TabsScreen() {
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
      <BehaviorGuide native="Native page hosts retain mounted React content; native code runs the selected transition." checks="Change pages and return; counters and scrolling should remain. Compare motion choices." />
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

