// Used by CI: copied into a new React Native app that installs the packed tarball.
import * as React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {
  Button,
  SegmentedControl,
  SettingsScreen,
  Switch,
  TransitionView,
} from '@bear-block/native-uix';

export default function App(): React.JSX.Element {
  const [tab, setTab] = React.useState('controls');
  const [on, setOn] = React.useState(true);
  const [count, setCount] = React.useState(0);
  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.pad}>
        <SegmentedControl
          segments={[
            {id: 'controls', label: 'Controls'},
            {id: 'settings', label: 'Settings'},
          ]}
          value={tab}
          onValueChange={setTab}
        />
      </View>
      <TransitionView style={styles.flex}>
        {tab === 'controls' ? (
          <View key="controls" style={[styles.pad, styles.gap]}>
            <Text>Packed consumer app</Text>
            <Button
              label={`Pressed ${count}`}
              variant="primary"
              onPress={() => setCount(c => c + 1)}
            />
            <Switch label="Enabled" value={on} onValueChange={setOn} />
          </View>
        ) : (
          <SettingsScreen
            key="settings"
            title="Settings"
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
        )}
      </TransitionView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  pad: {padding: 16},
  gap: {gap: 12},
});
