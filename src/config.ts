export type ButtonAppearances = {
  ios?: 'automatic' | 'plain' | 'gray' | 'tinted' | 'filled' | 'borderless' | 'bordered' | 'borderedTinted' | 'borderedProminent' | 'glass' | 'prominentGlass' | 'clearGlass' | 'prominentClearGlass';
  android?: 'automatic' | 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
};
export type ButtonSizes = {ios?: 'mini' | 'small' | 'medium' | 'large'; android?: 'small' | 'medium' | 'large'};
export type ListAppearances = {ios?: 'plain' | 'grouped' | 'insetGrouped'; android?: 'plain' | 'divided'};
export type TextFieldVariants = {
  ios?: 'plain' | 'rounded';
  android?: 'filled' | 'outlined';
};
export type NativeUIXConfig = {
  components?: {
    scrollingList?: {appearance?: ListAppearances};
    settingsScreen?: {appearance?: ListAppearances};
    form?: {appearance?: ListAppearances};
    textField?: {variant?: TextFieldVariants};
    button?: {variant?: 'primary' | 'secondary'; appearance?: ButtonAppearances; size?: ButtonSizes};
  };
};

export function mergeNativeUIXConfig(parent: NativeUIXConfig, config: NativeUIXConfig): NativeUIXConfig {
  const lists = Object.fromEntries(['scrollingList', 'settingsScreen', 'form'].map(key => {
    const component = key as 'scrollingList' | 'settingsScreen' | 'form';
    return [component, {appearance: {
      ios: config.components?.[component]?.appearance?.ios ?? parent.components?.[component]?.appearance?.ios,
      android: config.components?.[component]?.appearance?.android ?? parent.components?.[component]?.appearance?.android,
    }}];
  }));
  return {components: {
    ...lists,
    textField: {variant: {
      ios: config.components?.textField?.variant?.ios ?? parent.components?.textField?.variant?.ios,
      android: config.components?.textField?.variant?.android ?? parent.components?.textField?.variant?.android,
    }},
    button: {
      variant: config.components?.button?.variant ?? parent.components?.button?.variant,
      appearance: {
        ios: config.components?.button?.appearance?.ios ?? parent.components?.button?.appearance?.ios,
        android: config.components?.button?.appearance?.android ?? parent.components?.button?.appearance?.android,
      },
      size: {
        ios: config.components?.button?.size?.ios ?? parent.components?.button?.size?.ios,
        android: config.components?.button?.size?.android ?? parent.components?.button?.size?.android,
      },
    },
  }};
}
export function resolveTextFieldVariant(platform: 'ios' | 'android', variant: TextFieldVariants | undefined, config: NativeUIXConfig) {
  if (platform === 'ios') return variant?.ios ?? config.components?.textField?.variant?.ios ?? 'plain';
  return variant?.android ?? config.components?.textField?.variant?.android ?? 'outlined';
}

export function resolveButtonOptions(platform: 'ios' | 'android', variant: 'primary' | 'secondary' | undefined,
  appearance: ButtonAppearances | undefined, size: ButtonSizes | undefined, config: NativeUIXConfig) {
  return {
    variant: variant ?? config.components?.button?.variant ?? 'secondary',
    appearance: appearance?.[platform] ?? config.components?.button?.appearance?.[platform] ?? 'automatic',
    size: size?.[platform] ?? config.components?.button?.size?.[platform] ?? (platform === 'ios' ? 'large' : 'small'),
  };
}

export function resolveListAppearance(platform: 'ios' | 'android', component: 'scrollingList' | 'settingsScreen' | 'form',
  appearance: ListAppearances | undefined, config: NativeUIXConfig) {
  return appearance?.[platform] ?? config.components?.[component]?.appearance?.[platform]
    ?? (platform === 'ios' ? 'insetGrouped' : 'plain');
}
