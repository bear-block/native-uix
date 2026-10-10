"""Run against one connected example emulator in portrait gesture navigation."""
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get('ADB', 'adb')

def shell(*args):
    return subprocess.check_output([ADB, 'shell', *args], text=True)

def nodes():
    shell('uiautomator', 'dump', '/sdcard/native-uix-back.xml')
    return list(ET.fromstring(shell('cat', '/sdcard/native-uix-back.xml')).iter('node'))

def expect(level, count):
    for _ in range(10):
        labels = [n.get('text') for n in nodes()]
        if f'Level {level}' in labels and f'Count ({count})' in labels:
            print(f'PASS: Level {level}, Count ({count})', flush=True)
            return
        time.sleep(0.3)
    raise AssertionError(labels)

def tap(label):
    node = next(n for n in nodes() if n.get('text') == label)
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds')))
    shell('input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))

width, height = map(int, re.findall(r'(\d+)x(\d+)', shell('wm', 'size'))[-1])
y = str(height // 2)
previous = shell('settings', 'get', 'global', 'enable_back_animation').strip()
assert shell('settings', 'get', 'secure', 'navigation_mode').strip() == '2', 'Enable gesture navigation first.'
try:
    shell('settings', 'put', 'global', 'enable_back_animation', '1')
    shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d',
          'nativeuix://navigation/3', 'com.nativeuixexample')
    expect(3, 0)
    shell('input', 'swipe', '1', y, str(width // 2), y, '600')
    expect(2, 0)
    tap('Count (0)')
    shell('input', 'motionevent', 'DOWN', '1', y)
    for fraction in [0.03, 0.08, 0.13, 0.20, 0.13, 0.08, 0.02, 0.001]:
        shell('input', 'motionevent', 'MOVE', str(max(1, int(width * fraction))), y)
        time.sleep(0.07)
    shell('input', 'motionevent', 'UP', '1', y)
    expect(2, 1)
    tap('Rapid push → replace → pop')
    expect(2, 1)
    tap('Push level 3')
    expect(3, 0)
    shell('input', 'swipe', '1', y, str(width // 2), y, '600')
    expect(2, 1)
    print('PASS: completed/cancelled edge gestures and subsequent commands')
finally:
    if previous == 'null':
        shell('settings', 'delete', 'global', 'enable_back_animation')
    else:
        shell('settings', 'put', 'global', 'enable_back_animation', previous)
