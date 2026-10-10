import test from 'node:test';
import assert from 'node:assert/strict';
import {observeStackLinks} from '../src/components/stackLinkSource.ts';

const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  let emit;
  let resolveInitial;
  let removed = false;
  const pending = new Promise(resolve => {resolveInitial = resolve;});
  const source = {
    subscribe: listener => {emit = listener; return () => {removed = true;};},
    getInitialURL: () => pending,
  };
  return {source, emit: url => emit(url), resolve: url => resolveInitial(url), removed: () => removed};
}

test('a pending startup URL is delivered after subscribing', async () => {
  const f = fixture(), seen = [];
  const stop = observeStackLinks(f.source, url => seen.push(url));
  f.resolve('app://startup'); await settle();
  assert.deepEqual(seen, ['app://startup']);
  stop(); assert.equal(f.removed(), true);
});

test('new live URLs supersede a delayed initial URL', async () => {
  const f = fixture(), seen = [];
  const stop = observeStackLinks(f.source, url => seen.push(url));
  f.emit('app://newest'); f.resolve('app://old'); await settle();
  assert.deepEqual(seen, ['app://newest']); stop();
});

test('cleanup prevents late initial and queued live callbacks', async () => {
  const f = fixture(), seen = [];
  const stop = observeStackLinks(f.source, url => seen.push(url));
  stop(); f.emit('app://late'); f.resolve('app://startup'); await settle();
  assert.deepEqual(seen, []);
});

test('remount can opt out of initial URL replay while receiving live URLs', async () => {
  const f = fixture(), seen = [];
  f.source.getInitialURL = () => {throw new Error('must not query');};
  const stop = observeStackLinks(f.source, url => seen.push(url), false);
  f.emit('app://warm'); await settle();
  assert.deepEqual(seen, ['app://warm']); stop();
});
