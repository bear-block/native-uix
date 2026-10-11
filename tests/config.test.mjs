import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeNativeUIXConfig, resolveTextFieldVariant, resolveButtonOptions, resolveListAppearance} from '../src/config.ts';

test('text fields use platform fallbacks, app defaults, then per-field overrides', () => {
  assert.equal(resolveTextFieldVariant('ios', undefined, {}), 'plain');
  assert.equal(resolveTextFieldVariant('android', undefined, {}), 'outlined');
  const config = {components: {textField: {variant: {ios: 'rounded', android: 'filled'}}}};
  assert.equal(resolveTextFieldVariant('ios', undefined, config), 'rounded');
  assert.equal(resolveTextFieldVariant('android', undefined, config), 'filled');
  assert.equal(resolveTextFieldVariant('ios', {ios: 'plain'}, config), 'plain');
  assert.equal(resolveTextFieldVariant('android', {android: 'outlined'}, config), 'outlined');
  assert.equal(resolveTextFieldVariant('android', {ios: 'plain'}, config), 'filled');
});

test('nested defaults retain the other platform and unrelated component settings without mutation', () => {
  const parent = {components: {textField: {variant: {ios: 'rounded', android: 'filled'}}, button: {variant: 'primary'}}};
  const original = structuredClone(parent);
  const child = mergeNativeUIXConfig(parent, {components: {textField: {variant: {ios: 'plain'}}}});
  assert.equal(resolveTextFieldVariant('ios', undefined, child), 'plain');
  assert.equal(resolveTextFieldVariant('android', undefined, child), 'filled');
  assert.equal(child.components.button.variant, 'primary');
  assert.equal(resolveTextFieldVariant('android', undefined, mergeNativeUIXConfig(parent, {components: {textField: {variant: {android: undefined}}}})), 'filled');
  assert.deepEqual(parent, original);
  assert.deepEqual(mergeNativeUIXConfig(child, {}), child);
});

test('button emphasis, native appearance and size resolve independently per platform', () => {
  assert.deepEqual(resolveButtonOptions('ios', undefined, undefined, undefined, {}), {variant: 'secondary', appearance: 'automatic', size: 'large'});
  const parent = {components: {button: {variant: 'primary', appearance: {ios: 'tinted', android: 'tonal'}, size: {ios: 'small', android: 'medium'}}}};
  const child = mergeNativeUIXConfig(parent, {components: {button: {appearance: {ios: 'plain'}}}});
  assert.deepEqual(resolveButtonOptions('android', undefined, undefined, undefined, child), {variant: 'primary', appearance: 'tonal', size: 'medium'});
  assert.deepEqual(resolveButtonOptions('ios', 'secondary', {ios: 'filled'}, {ios: 'mini'}, child), {variant: 'secondary', appearance: 'filled', size: 'mini'});
  assert.deepEqual(resolveButtonOptions('ios', undefined, undefined, undefined, child), {variant: 'primary', appearance: 'plain', size: 'small'});
});

test('list defaults remain independent across components and inherit the other platform', () => {
  const parent = {components: {form: {appearance: {ios: 'grouped', android: 'divided'}}, scrollingList: {appearance: {ios: 'plain'}}}};
  const child = mergeNativeUIXConfig(parent, {components: {form: {appearance: {ios: 'insetGrouped'}}}});
  assert.equal(resolveListAppearance('android', 'form', undefined, child), 'divided');
  assert.equal(resolveListAppearance('ios', 'form', undefined, child), 'insetGrouped');
  assert.equal(resolveListAppearance('ios', 'scrollingList', undefined, child), 'plain');
  assert.equal(resolveListAppearance('ios', 'settingsScreen', undefined, child), 'insetGrouped');
  assert.equal(resolveListAppearance('android', 'scrollingList', undefined, child), 'plain');
  assert.equal(resolveListAppearance('android', 'form', {android: 'plain'}, child), 'plain');
  assert.equal(parent.components.form.appearance.ios, 'grouped');
});
