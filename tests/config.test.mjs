import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeNativeUIXConfig, resolveTextFieldVariant, resolveButtonOptions} from '../src/config.ts';

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
