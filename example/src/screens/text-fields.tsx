import {BehaviorGuide} from '../shared/demo';
import * as React from 'react';
import {
  Button,
  NativeUIXProvider,
  TextField,
  type TextFieldHandle,
  SegmentedControl,
  StackScrollView
} from '@bear-block/native-uix';
import {
  Platform,
  Text,
  View
} from 'react-native';
import {useLog, styles} from '../shared/demo';

export function TextFieldsScreen() {
  const [value, setValue] = React.useState('Hello');
  const [password, setPassword] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const [secure, setSecure] = React.useState(true);
  const [toggle, setToggle] = React.useState(true);
  const [log, record] = useLog();
  const field = React.useRef<TextFieldHandle>(null);
  return <StackScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <BehaviorGuide native="UITextField / Material TextInputLayout. Native input owns keyboard interaction and secure rendering." checks="Compare variants; focus and blur; reject edits; toggle secure text; test helper/error precedence." />
    <TextFieldVariantsDemo />
    <Text>Committed text: {value}</Text>
    <TextField ref={field} value={value} onChangeText={setValue} label="Display name" placeholder="Enter text" helperText="Visible to other people"
      error={showError ? 'Enter at least three characters' : undefined}
      onFocusChange={focused => record(`Focus: ${focused}`)} onSubmit={text => record(`Submit: ${text}`)} />
    <Button label={showError ? 'Clear error' : 'Show error'} onPress={() => setShowError(!showError)} />
    <Button label="Focus input" onPress={() => field.current?.focus()} />
    <Button label="Blur input" onPress={() => field.current?.blur()} />
    <Button label="Reset text" onPress={() => setValue('Hello')} />
    <Text>Rejected edits return to the committed text.</Text>
    <TextField value="Locked" onChangeText={() => record('Edit rejected')} />
    <TextField value={password} onChangeText={setPassword} secure={secure} passwordToggle={toggle}
      label="Password" placeholder="Enter password" helperText="Use the eye to show or hide; text is not logged" />
    <Button label={secure ? 'Use plain input' : 'Use secure input'} onPress={() => setSecure(!secure)} />
    <Button label={toggle ? 'Remove password toggle' : 'Enable password toggle'} onPress={() => setToggle(!toggle)} />
    <TextField value="Disabled" onChangeText={() => {}} disabled />
    {log.map((line, index) => <Text key={`${index}-${line}`}>{line}</Text>)}
  </StackScrollView>;
}

function TextFieldVariantsDemo() {
  const [alternate, setAlternate] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const variants = Platform.OS === 'ios'
    ? [{ios: 'plain' as const}, {ios: 'rounded' as const}]
    : [{android: 'outlined' as const}, {android: 'filled' as const}];
  const configured = alternate ? {ios: 'rounded' as const, android: 'filled' as const}
    : {ios: 'plain' as const, android: 'outlined' as const};
  return <NativeUIXProvider config={{components: {textField: {variant: configured}}}}>
    <Text>Variant defaults and explicit overrides</Text>
    <Button label={alternate ? 'Use platform defaults' : 'Use alternate defaults'} onPress={() => setAlternate(!alternate)} />
    <TextField label="From provider" placeholder="No variant prop" helperText="This field follows the provider"
      value={values.default ?? ''} onChangeText={text => setValues({...values, default: text})} />
    {variants.map(variant => {
      const name = 'ios' in variant ? variant.ios : variant.android;
      return <View key={name} style={styles.gallery}>
        <Text>{name} — explicit variant</Text>
        <TextField variant={variant} label={`${name} normal`} placeholder="Enter text" helperText="Supporting text"
          value={values[name] ?? ''} onChangeText={text => setValues({...values, [name]: text})} />
        <TextField variant={variant} label={`${name} error`} error="Check this value" value="Invalid" onChangeText={() => {}} />
        <TextField variant={variant} label={`${name} disabled`} disabled value="Unavailable" onChangeText={() => {}} />
        <TextField variant={variant} label={`${name} password`} secure passwordToggle value={values[`${name}-password`] ?? ''}
          onChangeText={text => setValues({...values, [`${name}-password`]: text})} />
      </View>;
    })}
  </NativeUIXProvider>;
}


export function TextFieldVariantScenario() {
  const names = Platform.OS === 'ios' ? ['plain', 'rounded'] : ['outlined', 'filled'];
  const [name, setName] = React.useState(names[0]);
  const [value, setValue] = React.useState('Hello');
  const variant = Platform.OS === 'ios' ? {ios: name as 'plain' | 'rounded'} : {android: name as 'outlined' | 'filled'};
  return <StackScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <SegmentedControl segments={names.map(id => ({id, label: id}))} value={name} onValueChange={setName} />
    <TextField variant={variant} label="Native text field" value={value} onChangeText={setValue} helperText="Type to verify the chosen variant" />
  </StackScrollView>;
}
export function TextFieldStateScenario() {
  const [value, setValue] = React.useState('Hello');
  const [error, setError] = React.useState(false);
  return <StackScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <TextField label="Supporting text" value={value} onChangeText={setValue} helperText="Helper text" error={error ? 'Check this value' : undefined} />
    <Button label={error ? 'Clear error' : 'Show error'} onPress={() => setError(v => !v)} />
    <TextField label="Disabled" value="Unavailable" disabled onChangeText={() => {}} />
    <TextField label="Password" secure passwordToggle value={value} onChangeText={setValue} />
  </StackScrollView>;
}
