import * as React from 'react';
import {View, Text, StyleSheet, Keyboard} from 'react-native';
import {Button, ScrollingList, StackScrollView, type StackScreenProps} from '@bear-block/native-uix';
import {useColors} from './demo';

type Scenario = {id: string; title: string; detail: string; component: React.ComponentType<StackScreenProps>};
/** Example-only navigation between bounded demos; the application Stack stays authoritative. */
export function scenarioScreen(name: string, native: string, scenarios: Scenario[]) {
  return function ComponentScenarios(props: StackScreenProps) {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [revision, setRevision] = React.useState(0);
    const colors = useColors();
    const scenario = scenarios.find(item => item.id === selected);
    if (!scenario) return <ScrollingList items={[
      {id: 'overview', title: `${name} overview`, subtitle: native, section: 'Overview'},
      ...scenarios.map(item => ({id: item.id, title: item.title, subtitle: item.detail, section: item.id === 'variants' ? 'Variants' : item.id === 'states' ? 'States' : 'Behaviors', action: true})),
    ]} onItemPress={setSelected} />;
    const Demo = scenario.component;
    return <View style={layout.screen}>
      <View style={layout.toolbar}>
        <Text accessibilityRole="header" style={{color: colors.text}}>{name} / {scenario.title}</Text>
        <View style={layout.actions}>
          <Button label="All scenarios" onPress={() => {Keyboard.dismiss(); setSelected(null);}} />
          <Button label="Reset scenario" onPress={() => {Keyboard.dismiss(); setRevision(n => n + 1);}} />
        </View>
      </View>
      <View key={`${selected}-${revision}`} style={layout.screen}><Demo {...props} /></View>
    </View>;
  };
}
export function NoAdditionalVariants() {
  const colors = useColors();
  return <StackScrollView contentContainerStyle={layout.note}>
    <Text style={{color: colors.text}}>This component currently exposes one platform presentation. Selection, disabled state and behavior are separate scenarios; extra visual variants are not implemented.</Text>
  </StackScrollView>;
}
const layout = StyleSheet.create({screen: {flex: 1}, toolbar: {padding: 12, gap: 8}, actions: {flexDirection: 'row', gap: 8}, note: {padding: 20}});
