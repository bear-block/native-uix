export type SettingsRow =
  | {id: string; kind: 'action'; label: string; disabled?: boolean}
  | {
      id: string;
      kind: 'switch';
      label: string;
      value: boolean;
      disabled?: boolean;
    };

export type SettingsSection = {id: string; title?: string; rows: SettingsRow[]};

export type SettingsAction =
  | {type: 'press'; rowId: string}
  | {type: 'valueChange'; rowId: string; value: boolean};

export type FlatSettingsItem = {
  kind: 'header' | 'action' | 'switch';
  id: string;
  sectionId: string;
  label: string;
  value: boolean;
  disabled: boolean;
};

/**
 * Validates descriptors at the JS boundary and flattens them for native code.
 * Throws on duplicate IDs or unknown row kinds instead of rendering a guess.
 */
export function flattenSettings(sections: SettingsSection[]): FlatSettingsItem[] {
  const sectionIds = new Set<string>();
  const rowIds = new Set<string>();
  const items: FlatSettingsItem[] = [];
  for (const section of sections) {
    if (sectionIds.has(section.id)) {
      throw new Error(`SettingsScreen: duplicate section id "${section.id}"`);
    }
    sectionIds.add(section.id);
    items.push({
      kind: 'header',
      id: section.id,
      sectionId: section.id,
      label: section.title ?? '',
      value: false,
      disabled: false,
    });
    for (const row of section.rows) {
      if (rowIds.has(row.id)) {
        throw new Error(`SettingsScreen: duplicate row id "${row.id}"`);
      }
      if (row.kind !== 'action' && row.kind !== 'switch') {
        throw new Error(
          `SettingsScreen: unsupported row kind "${(row as {kind: string}).kind}"`,
        );
      }
      rowIds.add(row.id);
      items.push({
        kind: row.kind,
        id: row.id,
        sectionId: section.id,
        label: row.label,
        value: row.kind === 'switch' ? row.value : false,
        disabled: row.disabled ?? false,
      });
    }
  }
  return items;
}

export function toSettingsAction(event: {
  type: string;
  rowId: string;
  value: boolean;
}): SettingsAction | null {
  if (event.type === 'press') {
    return {type: 'press', rowId: event.rowId};
  }
  if (event.type === 'valueChange') {
    return {type: 'valueChange', rowId: event.rowId, value: event.value};
  }
  return null;
}
