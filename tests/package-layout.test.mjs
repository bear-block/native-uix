import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';

const components = ['Button', 'Switch', 'SegmentedControl', 'Settings', 'TransitionView', 'TabContent', 'TabPage', 'ScrollingList', 'Stack', 'StackScreen', 'Tabs', 'Tab'];

const androidDir = 'android/src/main/java/dev/nativeuix';
const androidSources = readdirSync(androidDir)
  .map(file => readFileSync(`${androidDir}/${file}`, 'utf8'))
  .join('\n');

test('every component has a Fabric spec and both native hosts', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const name of components) {
    const spec = `src/specs/NativeUIX${name}NativeComponent.ts`;
    assert.ok(existsSync(spec), spec);
    assert.match(readFileSync(spec, 'utf8'), /codegenNativeComponent/);
    assert.equal(pkg.codegenConfig.ios.componentProvider[`NativeUIX${name}`], `RNUX${name}ComponentView`);
    assert.ok(existsSync(`ios/RNUX${name}ComponentView.mm`));
    assert.match(androidSources, new RegExp(`class NativeUIX${name}Manager\\b`), name);
  }
});
