import * as React from 'react';
import {
  SettingsScreen,
  useStackNavigation,
  type SettingsSection
} from '@bear-block/native-uix';

export function SettingsDemo() {
  const [airplane, setAirplane] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const navigation = useStackNavigation();
  const sections = React.useMemo<SettingsSection[]>(
    () => [
      {
        id: 'connectivity',
        title: 'Connectivity',
        rows: [
          {
            id: 'airplane',
            kind: 'switch',
            label: 'Airplane mode',
            value: airplane,
          },
          {
            id: 'roaming',
            kind: 'switch',
            label: 'Data roaming (locked by admin)',
            value: false,
          },
          {
            id: 'network',
            kind: 'action',
            label: 'Network',
            disabled: airplane,
          },
        ],
      },
      {
        id: 'general',
        title: 'General',
        rows: [
          {
            id: 'notifications',
            kind: 'switch',
            label: 'Notifications',
            value: notifications,
          },
          { id: 'privacy', kind: 'action', label: 'Privacy & security' },
          { id: 'about', kind: 'action', label: 'About' },
        ],
      },
      {
        id: 'many',
        title: '100 rows',
        rows: Array.from({ length: 100 }, (_, index) => ({
          id: `item-${index + 1}`,
          kind: 'action' as const,
          label: `Item ${index + 1}`,
        })),
      },
    ],
    [airplane, notifications],
  );
  return (
    <SettingsScreen
      sections={sections}
      onAction={action => {
        if (action.type === 'press') {
          navigation.push('item', { title: action.rowId });
        } else if (action.rowId === 'airplane') {
          setAirplane(action.value);
        } else if (action.rowId === 'notifications') {
          setNotifications(action.value);
        }
        // Roaming is never accepted: its switch snaps back.
      }}
    />
  );
}

