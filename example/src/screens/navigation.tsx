import * as React from 'react';
import {
  Button,
  StackScrollView,
  type StackHeader,
  type StackNavigation,
  type StackRoute,
  type StackScreenProps
} from '@bear-block/native-uix';
import {
  Linking,
  Platform,
  Settings,
  Text,
  View
} from 'react-native';
import {BehaviorGuide, useColors, styles} from '../shared/demo';
import {RestorationContext} from '../shared/restoration';

type NavigationParams = { depth: number } | undefined;

export function navigationHeader(
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

export function NavigationScreen({ route, navigation }: StackScreenProps) {
  const colors = useColors();
  const depth = (route.params as NavigationParams)?.depth ?? 1;
  const [count, setCount] = React.useState(0);
  const restore = React.useContext(RestorationContext);
  const [stressRunning, setStressRunning] = React.useState(false);
  const stressTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => {
    stressTimers.current.forEach(clearTimeout);
  }, []);
  const runRapidNavigation = () => {
    if (stressRunning) return;
    setStressRunning(true);
    // Commands intentionally arrive before a native transition can finish.
    const steps = [
      () => navigation.push('navigation', {depth: depth + 1}),
      () => navigation.replace('navigation', {depth: depth + 2}),
      navigation.pop,
      () => setStressRunning(false),
    ];
    stressTimers.current = steps.map((step, index) =>
      setTimeout(step, index * 100),
    );
  };
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
      <BehaviorGuide native="UINavigationController / native Android stack with Compose app bar." checks="Push, replace and pop; finish/cancel Back gestures; test links, saved history and rapid commands." />
      <Text style={[styles.body, { color: colors.secondary }]}>
        Odd levels use a large title, even levels a compact one. The counter
        survives pushing and coming back. Rapid navigation must return here
        with the same counter and a working native header.
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
        label={stressRunning ? 'Rapid navigation running…' : 'Rapid push → replace → pop'}
        disabled={stressRunning}
        style={styles.fullWidth}
        onPress={runRapidNavigation}
      />
      <Button label="Open deep link to level 3" style={styles.fullWidth}
        onPress={() => { Linking.openURL('nativeuix://navigation/3').catch(error =>
          console.warn('Deep link failed', error)); }} />
      <Button label="Restore saved stack" style={styles.fullWidth}
        onPress={() => restore?.()} />
      <Text style={[styles.body, {color: colors.secondary}]}>
        Routes save automatically. Restore recreates the stack: route history
        returns, while Count and scroll offsets reset. Open nativeuix://navigation/3
        to replace the history with levels 1–3, including after app termination.
      </Text>
      <Button
        label="Pop to root"
        destructive
        style={styles.hug}
        onPress={navigation.popToRoot}
      />
    </StackScrollView>
  );
}

