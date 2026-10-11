import * as React from 'react';
import {Platform} from 'react-native';
import {useNativeUIXConfig} from '../NativeUIXProvider';
import {resolveListAppearance} from '../config';
import {SettingsScreen, type SettingsScreenProps} from './SettingsScreen';
import type {SettingsSection} from './settingsModel';

export type SectionProps = SettingsSection;
/** A descriptor consumed by Form. It does not render an independent native view. */
export function Section(_props: SectionProps): React.JSX.Element {
  throw new Error('Section must be a direct child of Form.');
}
export type FormProps = Omit<SettingsScreenProps, 'sections'> & {children: React.ReactNode};
/** Experimental sectioned native form for action and controlled switch rows. */
export function Form({children, appearance, ...props}: FormProps): React.JSX.Element {
  const config = useNativeUIXConfig();
  const selected = resolveListAppearance(Platform.OS === 'ios' ? 'ios' : 'android', 'form', appearance, config);
  const sections: SettingsSection[] = [];
  React.Children.forEach(children, child => {
    if (child == null || typeof child === 'boolean') return;
    if (!React.isValidElement<SectionProps>(child) || child.type !== Section) {
      throw new Error('Form accepts only direct Section children (arrays are supported).');
    }
    sections.push(child.props);
  });
  return <SettingsScreen {...props} appearance={Platform.OS === 'ios' ? {ios: selected as 'plain' | 'grouped' | 'insetGrouped'} : {android: selected as 'plain' | 'divided'}} sections={sections} />;
}
