import * as React from 'react';
import {
  Platform,
  PlatformColor,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type ColorValue
} from 'react-native';

export function useColors() {
  const dark = useColorScheme() === 'dark';
  if (Platform.OS === 'ios') {
    return {
      text: PlatformColor('label'),
      secondary: PlatformColor('secondaryLabel'),
      card: PlatformColor('secondarySystemBackground'),
    };
  }
  return dark
    ? { text: '#e6e1e5', secondary: '#cac4d0', card: '#2b2930' }
    : { text: '#1d1b20', secondary: '#49454f', card: '#f3edf7' };
}

export type Colors = { text: ColorValue; secondary: ColorValue; card: ColorValue };

export function useLog() {
  const [log, setLog] = React.useState<string[]>([]);
  const record = React.useCallback(
    (line: string) => setLog(previous => [line, ...previous].slice(0, 5)),
    [],
  );
  return [log, record] as const;
}

export function SectionTitle({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: Colors;
}) {
  return (
    <Text
      accessibilityRole="header"
      style={[styles.sectionTitle, { color: colors.secondary }]}
    >
      {children}
    </Text>
  );
}

export function EventLog({ colors, log }: { colors: Colors; log: string[] }) {
  return (
    <>
      <SectionTitle colors={colors}>Event log</SectionTitle>
      <View style={[styles.log, { backgroundColor: colors.card }]}>
        {log.length === 0 ? (
          <Text style={{ color: colors.secondary }}>No events yet.</Text>
        ) : (
          log.map((line, index) => (
            <Text
              key={`${index}-${line}`}
              accessibilityLiveRegion={index === 0 ? 'polite' : 'none'}
              style={{ color: index === 0 ? colors.text : colors.secondary }}
            >
              {line}
            </Text>
          ))
        )}
      </View>
    </>
  );
}

export const styles = StyleSheet.create({
  behaviorGuide: {gap: 6},
  gallery: {gap: 12},
  flex: { flex: 1 },
  fullWidth: { width: '100%' },
  hug: { alignSelf: 'flex-start' },
  scroll: { gap: 12, padding: 20 },
  controls: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 12 },
  body: { fontSize: 15, lineHeight: 21 },
  pageTitle: { fontSize: 22, fontWeight: '600' },
  card: { borderRadius: 12, padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  log: { borderRadius: 12, gap: 4, padding: 12 },
  accessory: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  artwork: {
    backgroundColor: '#6750a4',
    borderRadius: 6,
    height: 32,
    width: 32,
  },
  accessoryTitle: { fontSize: 15, fontWeight: '600' },
  accessorySubtitle: { fontSize: 12 },
  accessoryAction: { fontSize: 15, fontWeight: '600' },
});


export function BehaviorGuide({native, checks}: {native: string; checks: string}) {
  const colors = useColors();
  return <View style={styles.behaviorGuide}>
    <Text accessibilityRole="header" style={[styles.sectionTitle, {color: colors.secondary}]}>Native implementation</Text>
    <Text style={[styles.body, {color: colors.text}]}>{native}</Text>
    <Text accessibilityRole="header" style={[styles.sectionTitle, {color: colors.secondary}]}>Behavior checks</Text>
    <Text style={[styles.body, {color: colors.text}]}>{checks}</Text>
  </View>;
}
