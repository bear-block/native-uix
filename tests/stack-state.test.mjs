import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStackState, validateStackState, resolveStackLink} from '../src/components/stackState.ts';

const names = ['home', 'detail'];
const snapshot = {version: 1, routes: [
  {key: 'home-1', name: 'home'},
  {key: 'detail-2', name: 'detail', params: {id: 42, filters: ['new', null]}},
]};

test('restores repeated screen instances and detaches params', () => {
  const input = {...snapshot, routes: [...snapshot.routes, {key: 'detail-3', name: 'detail'}]};
  const state = validateStackState(input, names);
  assert.deepEqual(state, input);
  state.routes[1].params.filters.push('changed');
  assert.deepEqual(input.routes[1].params.filters, ['new', null]);
  assert.deepEqual(parseStackState(JSON.stringify(input), names), input);
});

test('rejects corrupt, incompatible, empty and partially unknown histories', () => {
  assert.equal(parseStackState('{', names), null);
  for (const bad of [null, {version: 2, routes: snapshot.routes}, {version: 1, routes: []},
    {...snapshot, routes: [...snapshot.routes, {key: 'other', name: 'removed'}]},
    {...snapshot, routes: [...snapshot.routes, snapshot.routes[0]]}]) {
    assert.equal(validateStackState(bad, names), null);
  }
});

test('rejects params that JSON would silently lose or convert', () => {
  const cycle = {}; cycle.self = cycle;
  for (const params of [{fn: () => {}}, {bad: undefined}, {bad: Infinity}, {date: new Date()}, cycle, []]) {
    assert.equal(validateStackState({version: 1, routes: [{key: 'h', name: 'home', params}]}, names), null);
  }
});

test('deep links match explicit prefix boundaries and ignore unknown paths', () => {
  const config = {prefixes: ['nativeuix://', 'https://example.com'],
    resolve: path => path === 'detail/42' ? [{name: 'home'}, {name: 'detail', params: {id: 42}}] : null};
  assert.equal(resolveStackLink('https://example.com.attacker/detail/42', config), null);
  assert.equal(resolveStackLink('other://detail/42', config), null);
  assert.equal(resolveStackLink('nativeuix://unknown', config), null);
  assert.deepEqual(resolveStackLink('nativeuix://detail/42', config), resolveStackLink('https://example.com/detail/42', config));
  assert.equal(resolveStackLink('nativeuix://detail/42', {...config, resolve: () => []}), null);
  assert.equal(resolveStackLink('nativeuix://detail/42', {...config, resolve: () => {throw new Error('bad input');}}), null);
});
