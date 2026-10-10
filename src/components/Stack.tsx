import * as React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {observeStackLinks} from './stackLinkSource';

import NativeUIXStack from '../specs/NativeUIXStackNativeComponent';
import NativeUIXStackScreen from '../specs/NativeUIXStackScreenNativeComponent';

import {resolveStackLink, validateStackState, type StackLinking, type StackRoute, type StackRouteInput, type StackState} from './stackState';
export type {StackRoute} from './stackState';

export type StackHeaderAction = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export type StackHeaderSearch = {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  /** The search was dismissed; its text is cleared. */
  onCancel?: () => void;
  /**
   * iOS placement (`integrated` and `integratedButton` need iOS 26; earlier
   * versions use `stacked`). Android shows a search app bar in every case.
   */
  placement?: 'automatic' | 'integrated' | 'integratedButton' | 'stacked';
  /** iOS: a stacked search bar hides while scrolling down. Defaults to true. */
  hidesWhenScrolling?: boolean;
};

export type StackHeader = {
  title: string;
  /** Large collapses with the screen's scroll view; compact stays fixed. */
  size?: 'large' | 'compact';
  /** iOS 26+ subtitle (prompt on older iOS); Android app bar subtitle. */
  subtitle?: string;
  trailingAction?: StackHeaderAction;
  /**
   * A native search field: UISearchController in the navigation bar on iOS,
   * a Material 3 search app bar on Android. The field owns its text and
   * reports it.
   */
  search?: StackHeaderSearch;
};

export type StackNavigation = {
  push: (name: string, params?: object) => void;
  pop: () => void;
  popToRoot: () => void;
  replace: (name: string, params?: object) => void;
  /** Replace the complete history, for a resolved deep link or app reset. */
  reset: (routes: readonly StackRouteInput[]) => void;
  /** The Stack this one is nested in, for routes that cover its container (Tabs). */
  parent?: StackNavigation;
};

export type StackScreenProps = {
  route: StackRoute;
  navigation: StackNavigation;
};

export type StackPresentation = 'push' | 'modal' | 'fullScreenModal';

export type StackScreenDefinition = {
  component: React.ComponentType<StackScreenProps>;
  /**
   * How the route enters. `push` (default) slides in on the stack. `modal`
   * starts a new stack presented over this one: a page sheet on iOS (swipe
   * down closes it), a full-screen dialog on Android (slides up, covers the
   * tab bar). `fullScreenModal` covers the whole screen on iOS and is the
   * same as `modal` on Android. A modal route gets a close button where a
   * back button would be; routes pushed after it stack inside the modal.
   */
  presentation?: StackPresentation;
  /**
   * Pushed inside a tab, the route covers the tab bar: on iOS the bar slides
   * away with the push (`hidesBottomBarWhenPushed`); on Android the
   * navigation bar slides down.
   */
  hidesTabBar?: boolean;
  /** `null` shows no header, for a route that hosts its own (Tabs with Stacks). */
  header:
    StackHeader | null | ((route: StackRoute, navigation: StackNavigation) => StackHeader | null);
};

export type StackProps = {
  screens: Record<string, StackScreenDefinition>;
  initialRoute: {name: string; params?: object};
  /** Read once on mount. Invalid snapshots fall back to initialRoute. */
  initialState?: StackState;
  /** Subscribe to warm URLs and resolve the initial launch URL. */
  linking?: StackLinking;
  /** Called after a recognized URL replaces this Stack's history. */
  onLinkHandled?: (url: string) => void;
  /** Logical route updates, including committed native pops; not animation acknowledgement. */
  onStateChange?: (state: StackState) => void;
  style?: StyleProp<ViewStyle>;
};

const NavigationContext = React.createContext<StackNavigation | null>(null);
const RouteContext = React.createContext<StackRoute | null>(null);
const SearchTextContext = React.createContext('');

/** Text in this route's header search field; empty when there is none. */
export function useStackSearchText(): string {
  return React.useContext(SearchTextContext);
}

/** Navigation of the Stack this component renders in. */
export function useStackNavigation(): StackNavigation {
  const navigation = React.useContext(NavigationContext);
  if (navigation == null) {
    throw new Error('useStackNavigation must be used inside a Stack screen.');
  }
  return navigation;
}

/** The route this component renders in. */
export function useStackRoute(): StackRoute {
  const route = React.useContext(RouteContext);
  if (route == null) {
    throw new Error('useStackRoute must be used inside a Stack screen.');
  }
  return route;
}

/**
 * Experimental native stack: UINavigationController on iOS, a Material app
 * bar with shared-axis transitions and predictive back on Android. React
 * declares the routes; the platform runs every transition and gesture. A pop
 * the user commits natively is reported once and removed here, never popped
 * a second time. Routes below the top stay mounted, keeping their state.
 */
export function Stack({screens, initialRoute, initialState, onStateChange, linking, onLinkHandled, style}: StackProps): React.JSX.Element {
  const nextKey = React.useRef(0);
  const usedKeys = React.useRef(new Set<string>());
  const makeRoute = React.useCallback(
    (name: string, params?: object): StackRoute => {
      if (!Object.hasOwn(screens, name)) {
        throw new Error(`Stack: unknown screen "${name}"`);
      }
      let key: string;
      do { nextKey.current += 1; key = `${name}-${nextKey.current}`; }
      while (usedKeys.current.has(key));
      return {key, name, params};
    },
    [screens],
  );
  const [routes, setRoutes] = React.useState<StackRoute[]>(() => {
    const restored = validateStackState(initialState, Object.keys(screens));
    if (restored) {
      restored.routes.forEach(route => usedKeys.current.add(route.key));
      return restored.routes;
    }
    return [makeRoute(initialRoute.name, initialRoute.params)];
  });
  React.useEffect(() => {
    onStateChange?.({version: 1, routes: routes.map(route => ({...route}))});
  }, [routes, onStateChange]);

  const parent = React.useContext(NavigationContext) ?? undefined;
  const [searchTexts, setSearchTexts] = React.useState<Record<string, string>>({});
  const navigation = React.useMemo<StackNavigation>(
    () => ({
      parent,
      reset: inputs => {
        if (!inputs.length || inputs.some(route => !Object.hasOwn(screens, route.name))) {
          throw new Error('Stack.reset: provide a nonempty history of registered screens.');
        }
        setRoutes(inputs.map(route => makeRoute(route.name, route.params)));
      },
      push: (name, params) => {
        const route = makeRoute(name, params);
        setRoutes(current => [...current, route]);
      },
      pop: () => setRoutes(current => (current.length > 1 ? current.slice(0, -1) : current)),
      popToRoot: () => setRoutes(current => current.slice(0, 1)),
      replace: (name, params) => {
        const route = makeRoute(name, params);
        setRoutes(current => [...current.slice(0, -1), route]);
      },
    }),
    [makeRoute, parent, screens],
  );

  React.useEffect(() => {
    if (!linking) return;
    const handle = (url: string) => {
      const inputs = resolveStackLink(url, linking);
      if (!inputs || inputs.some(route => !Object.hasOwn(screens, route.name))) return;
      navigation.reset(inputs);
      onLinkHandled?.(url);
    };
    return observeStackLinks(linking.source ?? {
      subscribe: receive => {
        const subscription = Linking.addEventListener('url', event => receive(event.url));
        return () => subscription.remove();
      },
      getInitialURL: async () => (await Linking.getInitialURL()) ?? null,
    }, handle, linking.handleInitialURL !== false);
  }, [linking, navigation, onLinkHandled, screens]);

  return (
    <NavigationContext.Provider value={navigation}>
      <NativeUIXStack
        style={[styles.stack, style]}
        onNativePop={event => {
          const {topKey} = event.nativeEvent;
          setRoutes(current => {
            const index = current.findIndex(route => route.key === topKey);
            return index >= 0 ? current.slice(0, index + 1) : current;
          });
        }}
      >
        {routes.map(route => {
          const definition = screens[route.name]!;
          const header =
            typeof definition.header === 'function'
              ? definition.header(route, navigation)
              : definition.header;
          const Component = definition.component;
          return (
            <NativeUIXStackScreen
              key={route.key}
              routeKey={route.key}
              headerHidden={header == null}
              hidesTabBar={definition.hidesTabBar ?? false}
              presentation={definition.presentation ?? 'push'}
              screenTitle={header?.title ?? ''}
              headerSize={header?.size ?? 'large'}
              headerSubtitle={header?.subtitle ?? ''}
              trailingId={header?.trailingAction ? 'trailing' : ''}
              trailingLabel={header?.trailingAction?.label ?? ''}
              trailingDisabled={header?.trailingAction?.disabled ?? false}
              onHeaderAction={() => {
                if (!header?.trailingAction?.disabled) {
                  header?.trailingAction?.onPress();
                }
              }}
              searchEnabled={header?.search != null}
              searchPlaceholder={header?.search?.placeholder ?? ''}
              searchPlacement={header?.search?.placement ?? 'automatic'}
              searchHidesWhenScrolling={header?.search?.hidesWhenScrolling ?? true}
              onSearch={event => {
                const {type, text} = event.nativeEvent;
                const search = header?.search;
                if (type === 'change' || type === 'cancel') {
                  setSearchTexts(current => ({...current, [route.key]: text}));
                }
                if (type === 'change') {
                  search?.onChangeText?.(text);
                } else if (type === 'submit') {
                  search?.onSubmit?.(text);
                } else if (type === 'cancel') {
                  search?.onCancel?.();
                }
              }}
              collapsable={false}
              style={StyleSheet.absoluteFill}
            >
              <RouteContext.Provider value={route}>
                <SearchTextContext.Provider value={searchTexts[route.key] ?? ''}>
                  <Component route={route} navigation={navigation} />
                </SearchTextContext.Provider>
              </RouteContext.Provider>
            </NativeUIXStackScreen>
          );
        })}
      </NativeUIXStack>
    </NavigationContext.Provider>
  );
}

/**
 * ScrollView for Stack screens: on iOS its insets follow the navigation bar
 * and the large title collapses with it; on Android it drives the app bar
 * through nested scrolling.
 */
export function StackScrollView(props: ScrollViewProps): React.JSX.Element {
  return <ScrollView contentInsetAdjustmentBehavior="automatic" nestedScrollEnabled {...props} />;
}

const styles = StyleSheet.create({stack: {flex: 1}});
