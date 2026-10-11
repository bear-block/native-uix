import * as React from 'react';
import {
  SegmentedControl,
  StackScrollView,
  Switch
} from '@bear-block/native-uix';
import {
  Text,
} from 'react-native';
import {BehaviorGuide, useColors, useLog, SectionTitle, EventLog, styles} from '../shared/demo';

export function SwitchesScreen() {
  const colors = useColors();
  const [log, record] = useLog();
  const [wifi, setWifi] = React.useState(true);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <BehaviorGuide native="UISwitch and UISegmentedControl / Material switch and segmented buttons." checks="Accept and reject value requests; check disabled interaction and selection feedback." />
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

export function SegmentedScreen() {
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

