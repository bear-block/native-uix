import * as React from 'react';
import {
  Button,
  NativeUIXProvider,
  type ButtonAppearances,
  type ButtonSizes,
  SegmentedControl,
  StackScrollView
} from '@bear-block/native-uix';
import {
  Platform,
  Text,
  View
} from 'react-native';
import {BehaviorGuide, useColors, useLog, SectionTitle, EventLog, styles} from '../shared/demo';

export function ButtonsScreen() {
  const colors = useColors();
  const [log, record] = useLog();
  const [presses, setPresses] = React.useState(0);
  return (
    <StackScrollView contentContainerStyle={styles.scroll}>
      <BehaviorGuide native="UIButton configurations / MaterialButton. Native code owns control layout and press feedback." checks="Compare appearances and sizes; change provider defaults; press enabled and disabled samples; check long labels." />
      <ButtonAppearanceGallery />
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

function ButtonAppearanceGallery() {
  const [alternate, setAlternate] = React.useState(false);
  const [presses, setPresses] = React.useState(0);
  const appearance: ButtonAppearances = alternate ? {ios: 'plain', android: 'text'} : {ios: 'automatic', android: 'automatic'};
  const names: ButtonAppearances[] = Platform.OS === 'ios'
    ? ['automatic', 'plain', 'gray', 'tinted', 'filled', 'borderless', 'bordered', 'borderedTinted', 'borderedProminent',
       'glass', 'prominentGlass', 'clearGlass', 'prominentClearGlass'].map(ios => ({ios} as ButtonAppearances))
    : ['automatic', 'filled', 'tonal', 'outlined', 'text', 'elevated'].map(android => ({android} as ButtonAppearances));
  const sizes: ButtonSizes[] = Platform.OS === 'ios'
    ? ['mini', 'small', 'medium', 'large'].map(ios => ({ios} as ButtonSizes))
    : ['small', 'medium', 'large'].map(android => ({android} as ButtonSizes));
  const press = () => setPresses(count => count + 1);
  return <NativeUIXProvider config={{components: {button: {appearance}}}}>
    <Text>Button appearances — presses: {presses}</Text>
    <Button label={alternate ? 'Restore button defaults' : 'Change button defaults'} appearance={{ios: 'gray', android: 'outlined'}}
      onPress={() => setAlternate(!alternate)} />
    <Button label="Button from provider" onPress={press} />
    {names.map(item => {
      const name = item.ios ?? item.android;
      return <View key={name} style={styles.gallery}>
        <Text>{name}</Text>
        <Button label={`${name} action (${presses})`} appearance={item} onPress={press} />
        <Button label={`${name} destructive`} appearance={item} destructive onPress={press} />
        <Button label={`${name} disabled`} appearance={item} disabled onPress={() => setPresses(-999)} />
      </View>;
    })}
    <Text>Native sizing</Text>
    {sizes.map(item => {
      const name = item.ios ?? item.android;
      return <Button key={name} label={`Size ${name}`} appearance={{ios: 'filled', android: 'filled'}} size={item} onPress={press} />;
    })}
  </NativeUIXProvider>;
}


export function ButtonVariantScenario() {
  const names = Platform.OS === 'ios'
    ? ['automatic', 'plain', 'gray', 'tinted', 'filled', 'borderless', 'bordered', 'borderedTinted', 'borderedProminent', 'glass', 'prominentGlass', 'clearGlass', 'prominentClearGlass']
    : ['automatic', 'filled', 'tonal', 'outlined', 'text', 'elevated'];
  const [index, setIndex] = React.useState(0);
  const [size, setSize] = React.useState(Platform.OS === 'ios' ? 'large' : 'small');
  const [count, setCount] = React.useState(0);
  const appearance = {[Platform.OS]: names[index]} as ButtonAppearances;
  return <StackScrollView contentContainerStyle={styles.scroll}>
    <Text>Appearance: {names[index]} · presses: {count}</Text>
    <View style={styles.row}>
      <Button label="Previous variant" disabled={index === 0} onPress={() => setIndex(i => i - 1)} />
      <Button label="Next variant" disabled={index === names.length - 1} onPress={() => setIndex(i => i + 1)} />
    </View>
    <SegmentedControl segments={(Platform.OS === 'ios' ? ['mini', 'small', 'medium', 'large'] : ['small', 'medium', 'large']).map(id => ({id, label: id}))}
      value={size} onValueChange={setSize} />
    <Button label="Native action" appearance={appearance} size={{[Platform.OS]: size} as ButtonSizes} onPress={() => setCount(n => n + 1)} />
    <Button label="Destructive action" destructive appearance={appearance} size={{[Platform.OS]: size} as ButtonSizes} onPress={() => setCount(n => n + 1)} />
    <Button label="Disabled action" disabled appearance={appearance} size={{[Platform.OS]: size} as ButtonSizes} onPress={() => setCount(-999)} />
  </StackScrollView>;
}
export function ButtonStateScenario() {
  const [count, setCount] = React.useState(0);
  return <StackScrollView contentContainerStyle={styles.scroll}>
    <Text>Enabled presses: {count}</Text>
    <Button label="Enabled" onPress={() => setCount(n => n + 1)} />
    <Button label="Disabled" disabled onPress={() => setCount(-999)} />
    <Button label="Destructive" destructive onPress={() => setCount(n => n + 1)} />
  </StackScrollView>;
}
