"""Check selected-tab and per-Stack restoration on one portrait Android emulator."""
import os,subprocess,time,re,xml.etree.ElementTree as E
adb=os.environ.get('ADB', 'adb')
def sh(*args):return subprocess.check_output([adb,'shell',*args],text=True)
def nodes():
 sh('uiautomator','dump','/sdcard/tab-check.xml');return list(E.fromstring(sh('cat','/sdcard/tab-check.xml')).iter('node'))
def expect(label):
 for _ in range(10):
  if any(n.get('text')==label for n in nodes()):print('PASS:',label,flush=True);return
  time.sleep(.3)
 raise AssertionError(label)
def tap(label):
 ns=[n for n in nodes() if n.get('text')==label];assert ns,label
 n=ns[-1];x,y,a,b=map(int,re.findall(r'\d+',n.get('bounds')));sh('input','tap',str((x+a)//2),str((y+b)//2))
sh('am','force-stop','com.nativeuixexample');sh('am','start','-W','-n','com.nativeuixexample/.MainActivity');expect('Components')
sh('am','start','-W','-a','android.intent.action.VIEW','-d','nativeuix://navigation/3','com.nativeuixexample');expect('Level 3')
tap('Components')
if not any(n.get('text') == 'Continue (0)' for n in nodes()):
 expect('Native UIX');tap('Buttons')
expect('Continue (0)')
tap('Search');expect('Search items')
tap('Settings');expect('Settings')
sh('am','force-stop','com.nativeuixexample');sh('am','start','-W','-n','com.nativeuixexample/.MainActivity');expect('Settings')
tap('Components');expect('Continue (0)')
tap('Navigation');expect('Level 3')
tap('Search');expect('Search items')
sh('am','force-stop','com.nativeuixexample');sh('am','start','-W','-n','com.nativeuixexample/.MainActivity');expect('Search items')
sh('am','start','-W','-a','android.intent.action.VIEW','-d','nativeuix://navigation/2','com.nativeuixexample');expect('Level 2')
tap('Components');expect('Continue (0)')
print('PASS: selected tab and independent Stack restoration; deep link preserves other tab history',flush=True)
