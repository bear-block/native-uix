import test from 'node:test';
import assert from 'node:assert/strict';

import {
  flattenSettings,
  toSettingsAction,
} from '../src/components/settingsModel.ts';

const sections = [
  {
    id: 'general',
    title: 'General',
    rows: [
      {id: 'wifi', kind: 'switch', label: 'Wi-Fi', value: true},
      {id: 'about', kind: 'action', label: 'About', disabled: true},
    ],
  },
];

test('flattens sections into header and row items', () => {
  assert.deepEqual(flattenSettings(sections), [
    {kind: 'header', id: 'general', sectionId: 'general', label: 'General', value: false, disabled: false},
    {kind: 'switch', id: 'wifi', sectionId: 'general', label: 'Wi-Fi', value: true, disabled: false},
    {kind: 'action', id: 'about', sectionId: 'general', label: 'About', value: false, disabled: true},
  ]);
});

test('rejects duplicate row and section IDs', () => {
  const duplicateRow = [{id: 's', rows: [
    {id: 'a', kind: 'action', label: 'A'},
    {id: 'a', kind: 'action', label: 'B'},
  ]}];
  assert.throws(() => flattenSettings(duplicateRow), /duplicate row id "a"/);
  const duplicateSection = [{id: 's', rows: []}, {id: 's', rows: []}];
  assert.throws(() => flattenSettings(duplicateSection), /duplicate section id "s"/);
});

test('rejects unknown row kinds instead of guessing', () => {
  const bad = [{id: 's', rows: [{id: 'x', kind: 'slider', label: 'X'}]}];
  assert.throws(() => flattenSettings(bad), /unsupported row kind "slider"/);
});

test('maps native events to typed actions', () => {
  assert.deepEqual(toSettingsAction({type: 'press', rowId: 'a', value: false}), {type: 'press', rowId: 'a'});
  assert.deepEqual(
    toSettingsAction({type: 'valueChange', rowId: 'b', value: true}),
    {type: 'valueChange', rowId: 'b', value: true},
  );
  assert.equal(toSettingsAction({type: 'other', rowId: 'c', value: false}), null);
});

test('section footers are non-interactive and follow all section rows', () => {
  const flat = flattenSettings([{...sections[0], footer: 'This setting syncs.'}, {id: 'empty', title: 'Empty', rows: [], footer: 'No values.'}]);
  assert.deepEqual(flat[3], {kind: 'footer', id: 'general', sectionId: 'general', label: 'This setting syncs.', value: false, disabled: false});
  assert.deepEqual(flat.slice(4).map(item => item.kind), ['header', 'footer']);
  assert.throws(() => flattenSettings([{id: '', rows: []}]), /nonempty section/);
  assert.throws(() => flattenSettings([{id: 's', rows: [{id: '', kind: 'action', label: 'Empty'}]}]), /nonempty row/);
});
