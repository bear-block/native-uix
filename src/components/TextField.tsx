import * as React from 'react';
import {Platform, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {useNativeUIXConfig, type TextFieldVariants} from '../NativeUIXProvider';
import {resolveTextFieldVariant} from '../config';
import NativeField, {Commands} from '../specs/NativeUIXTextFieldNativeComponent';
export type TextFieldHandle = {focus: () => void; blur: () => void};
export type TextFieldProps = {
  variant?: TextFieldVariants;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  passwordToggle?: boolean;
  disabled?: boolean;
  secure?: boolean;
  onFocusChange?: (focused: boolean) => void;
  onSubmit?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
};
/** Experimental single-line native input. The parent owns the committed text. */
export const TextField = React.forwardRef<TextFieldHandle, TextFieldProps>(function TextField(
  {variant, value, onChangeText, onFocusChange, onSubmit, style, ...props}, forwardedRef,
) {
  const config = useNativeUIXConfig();
  const selected = resolveTextFieldVariant(Platform.OS === 'ios' ? 'ios' : 'android', variant, config);
  const ref = React.useRef<React.ComponentRef<typeof NativeField>>(null);
  const latest = React.useRef(0);
  const [, render] = React.useReducer((n: number) => n + 1, 0);
  React.useImperativeHandle(forwardedRef, () => ({
    focus: () => { if (ref.current) Commands.focus(ref.current); },
    blur: () => { if (ref.current) Commands.blur(ref.current); },
  }), []);
  React.useLayoutEffect(() => {
    if (ref.current) Commands.reconcile(ref.current, value, latest.current);
  });
  return <NativeField {...props} variant={selected} ref={ref} value={value} style={[styles.field, {height: (selected === 'outlined' ? 64 : 56) + (Platform.OS === 'ios' && props.label ? 24 : 0) + (props.helperText || props.error ? 28 : 0)}, style]}
    onTextChange={event => {
      latest.current = event.nativeEvent.eventCount;
      onChangeText(event.nativeEvent.text);
      render();
    }}
    onFieldFocus={event => onFocusChange?.(event.nativeEvent.focused)}
    onFieldSubmit={event => onSubmit?.(event.nativeEvent.text)} />;
});
const styles = StyleSheet.create({field: {height: 56, alignSelf: 'stretch'}});
