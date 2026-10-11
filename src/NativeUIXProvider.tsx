import * as React from 'react';

import {mergeNativeUIXConfig, type NativeUIXConfig} from './config';
export type {NativeUIXConfig, TextFieldVariants, ButtonAppearances, ButtonSizes, ListAppearances} from './config';
const ConfigContext = React.createContext<NativeUIXConfig>({});
/** App defaults. Nested providers override only the supplied component options. */
export function NativeUIXProvider({config, children}: {
  config: NativeUIXConfig;
  children: React.ReactNode;
}): React.JSX.Element {
  const parent = React.useContext(ConfigContext);
  const value = React.useMemo(() => mergeNativeUIXConfig(parent, config), [parent, config]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
export function useNativeUIXConfig(): NativeUIXConfig {
  return React.useContext(ConfigContext);
}
