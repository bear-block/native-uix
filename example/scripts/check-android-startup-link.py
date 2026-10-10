"""Verify latest Android intent survives URLs delivered before Stack mounts."""
import os
import subprocess
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get('ADB', 'adb')

def shell(*args):
    return subprocess.check_output([ADB, 'shell', *args], text=True, timeout=30)

def labels():
    shell('uiautomator', 'dump', '/sdcard/native-uix-startup.xml')
    return [node.get('text') for node in ET.fromstring(
        shell('cat', '/sdcard/native-uix-startup.xml')).iter('node')]

def expect(label):
    for _ in range(10):
        if label in labels():
            print('PASS:', label, flush=True)
            return
        time.sleep(0.3)
    raise AssertionError(f'Missing {label}')

shell('am', 'force-stop', 'com.nativeuixexample')
shell('am', 'start', '-W', '-n', 'com.nativeuixexample/.MainActivity',
      '--ei', 'nativeuixStartupDelayMs', '10000')
expect('Waiting to mount navigation…')
for level in [3, 4]:
    shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW',
          '-d', f'nativeuix://navigation/{level}', 'com.nativeuixexample')
# Confirm both links arrived in the intended pre-subscription interval.
expect('Waiting to mount navigation…')
expect('Level 4')
shell('input', 'keyevent', '4')
expect('Level 3')
print('PASS: latest startup URL wins, with the correct Back history', flush=True)
