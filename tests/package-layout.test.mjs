import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const components = ['Button', 'Switch', 'SegmentedControl', 'Settings', 'TransitionView'];

test('every component has a Fabric spec and both native hosts', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const name of components) {
    const spec = `src/specs/NativeUIX${name}NativeComponent.ts`;
    assert.ok(existsSync(spec), spec);
    assert.match(readFileSync(spec, 'utf8'), /codegenNativeComponent/);
    assert.equal(pkg.codegenConfig.ios.componentProvider[`NativeUIX${name}`], `RNUX${name}ComponentView`);
    assert.ok(existsSync(`ios/RNUX${name}ComponentView.mm`));
    assert.ok(existsSync(`android/src/main/java/dev/nativeuix/NativeUIX${name}Manager.kt`));
  }
});
