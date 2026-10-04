#import "RNUXTabsComponentView.h"

#import <React/RCTMountingTransactionObserving.h>
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

#import "RNUXTabComponentView.h"
#import "RNUXTabsAccessoryComponentView.h"

using namespace facebook::react;

/*
 * React declares the tabs; UIKit's tab bar shows and switches them. A tab the
 * user selects is shown at once and reported; React's `selectedId` selects a
 * tab programmatically.
 */
@interface RNUXTabsComponentView () <RCTMountingTransactionObserving, UITabBarControllerDelegate>
@end

@implementation RNUXTabsComponentView {
  UITabBarController *_tabBar;
  NSMutableArray<RNUXTabComponentView *> *_tabs;
  NSString *_selectedId;
  RNUXTabsAccessoryComponentView *_accessory;
  // Set while this view changes the tab bar itself; UIKit reports those
  // changes as selections too, which are not the user's.
  BOOL _applying;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTabsComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTabsProps>();
    _tabs = [NSMutableArray new];
    _selectedId = @"";
    _tabBar = [UITabBarController new];
    _tabBar.delegate = self;
    self.contentView = _tabBar.view;
  }
  return self;
}

// The tab bar controller joins the nearest view controller, so appearance
// callbacks, safe areas and trait changes reach the tabs.
- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window != nil && _tabBar.parentViewController == nil) {
    UIResponder *responder = self.superview;
    while (responder != nil && ![responder isKindOfClass:UIViewController.class]) {
      responder = responder.nextResponder;
    }
    UIViewController *parent = (UIViewController *)responder;
    if (parent != nil) {
      [parent addChildViewController:_tabBar];
      [_tabBar didMoveToParentViewController:parent];
    }
  } else if (self.window == nil && _tabBar.parentViewController != nil) {
    [_tabBar willMoveToParentViewController:nil];
    [_tabBar removeFromParentViewController];
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<NativeUIXTabsProps const>(props);
  _selectedId = [NSString stringWithUTF8String:next.selectedId.c_str()];
  _applying = YES;
  if (@available(iOS 26.0, *)) {
    switch (next.minimizeBehavior) {
      case NativeUIXTabsMinimizeBehavior::Never:
        _tabBar.tabBarMinimizeBehavior = UITabBarMinimizeBehaviorNever;
        break;
      case NativeUIXTabsMinimizeBehavior::OnScrollDown:
        _tabBar.tabBarMinimizeBehavior = UITabBarMinimizeBehaviorOnScrollDown;
        break;
      case NativeUIXTabsMinimizeBehavior::OnScrollUp:
        _tabBar.tabBarMinimizeBehavior = UITabBarMinimizeBehaviorOnScrollUp;
        break;
      default:
        _tabBar.tabBarMinimizeBehavior = UITabBarMinimizeBehaviorAutomatic;
    }
  }
  if (@available(iOS 18.0, *)) {
    switch (next.tabsLayout) {
      case NativeUIXTabsTabsLayout::TabBar:
        _tabBar.mode = UITabBarControllerModeTabBar;
        break;
      case NativeUIXTabsTabsLayout::Sidebar:
        _tabBar.mode = UITabBarControllerModeTabSidebar;
        break;
      default:
        _tabBar.mode = UITabBarControllerModeAutomatic;
    }
  }
  [super updateProps:props oldProps:oldProps];
  [self applySelection];
  _applying = NO;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if ([childComponentView isKindOfClass:RNUXTabsAccessoryComponentView.class]) {
    _accessory = (RNUXTabsAccessoryComponentView *)childComponentView;
    [self applyAccessory];
    return;
  }
  // The tab lives in its own controller's view, not in this view.
  [_tabs insertObject:(RNUXTabComponentView *)childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (childComponentView == _accessory) {
    _accessory = nil;
    [self applyAccessory];
    return;
  }
  [_tabs removeObject:(RNUXTabComponentView *)childComponentView];
  [childComponentView removeFromSuperview];
}

// iOS 26+: the tab bar's bottom accessory, above the bar or inline beside it
// when the bar minimizes. Earlier versions have no accessory.
- (void)applyAccessory
{
  if (@available(iOS 26.0, *)) {
    UIView *content = _accessory.hostView;
    if (_tabBar.bottomAccessory.contentView == content) {
      return;
    }
    UITabAccessory *accessory = content != nil ? [[UITabAccessory alloc] initWithContentView:content] : nil;
    [_tabBar setBottomAccessory:accessory animated:self.window != nil];
  }
}

- (void)mountingTransactionDidMount:(MountingTransaction const &)transaction
               withSurfaceTelemetry:(SurfaceTelemetry const &)surfaceTelemetry
{
  _applying = YES;
  if (@available(iOS 18.0, *)) {
    [self applyTabs];
  } else {
    NSMutableArray<UIViewController *> *controllers = [NSMutableArray new];
    for (RNUXTabComponentView *tab in _tabs) {
      [controllers addObject:tab.controller];
    }
    if (![controllers isEqualToArray:_tabBar.viewControllers ?: @[]]) {
      [_tabBar setViewControllers:controllers animated:NO];
    }
  }
  [self applySelection];
  _applying = NO;
}

// iOS 18+: tabs are UITab objects, which add the search tab and keep each
// tab's identity; a tab is rebuilt only when its controller changes.
- (void)applyTabs API_AVAILABLE(ios(18.0))
{
  NSMutableArray<UITab *> *uiTabs = [NSMutableArray new];
  for (RNUXTabComponentView *tab in _tabs) {
    UIViewController *controller = tab.controller;
    UITab *uiTab = tab.uiTab;
    BOOL isSearch = [uiTab isKindOfClass:UISearchTab.class];
    if (uiTab == nil || tab.uiTabController != controller || isSearch != tab.searchRole) {
      UIViewController * (^provider)(UITab *) = ^UIViewController *(UITab *unused) {
        return controller;
      };
      if (tab.searchRole) {
        UISearchTab *search = [[UISearchTab alloc] initWithViewControllerProvider:provider];
        if (@available(iOS 26.0, *)) {
          search.automaticallyActivatesSearch = YES;
        }
        uiTab = search;
      } else {
        // A lazy tab's controller changes once its Stack mounts; UIKit keeps
        // the controller of a tab with the same identifier, so a rebuilt tab
        // gets a new one.
        NSString *identifier = tab.uiTab == nil
            ? tab.tabId
            : [NSString stringWithFormat:@"%@#%p", tab.tabId, controller];
        uiTab = [[UITab alloc] initWithTitle:tab.title ?: @""
                                       image:tab.image
                                  identifier:identifier
                      viewControllerProvider:provider];
      }
      tab.uiTab = uiTab;
      tab.uiTabController = controller;
      if (tab.title.length > 0) {
        uiTab.title = tab.title;
      }
      if (tab.image != nil) {
        uiTab.image = tab.image;
      }
      uiTab.badgeValue = tab.badge;
    }
    [uiTabs addObject:uiTab];
  }
  if (![uiTabs isEqualToArray:_tabBar.tabs]) {
    [_tabBar setTabs:uiTabs animated:NO];
  }
}

- (void)applySelection
{
  for (RNUXTabComponentView *tab in _tabs) {
    if (![tab.tabId isEqualToString:_selectedId]) {
      continue;
    }
    if (@available(iOS 18.0, *)) {
      UITab *uiTab = tab.uiTab;
      if (uiTab != nil && _tabBar.selectedTab != uiTab && [_tabBar.tabs containsObject:uiTab]) {
        _tabBar.selectedTab = uiTab;
      }
    } else if (_tabBar.selectedViewController != tab.controller &&
               [_tabBar.viewControllers containsObject:tab.controller]) {
      _tabBar.selectedViewController = tab.controller;
    }
  }
}

- (void)reportSelection:(RNUXTabComponentView *)tab
{
  if (_applying || [tab.tabId isEqualToString:_selectedId]) {
    return;
  }
  _selectedId = tab.tabId;
  auto emitter = std::static_pointer_cast<NativeUIXTabsEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onTabChange({std::string(tab.tabId.UTF8String)});
  }
}

#pragma mark - UITabBarControllerDelegate

- (void)tabBarController:(UITabBarController *)tabBarController
    didSelectTab:(UITab *)selectedTab
     previousTab:(UITab *)previousTab API_AVAILABLE(ios(18.0))
{
  for (RNUXTabComponentView *tab in _tabs) {
    if (tab.uiTab == selectedTab) {
      [self reportSelection:tab];
    }
  }
}

- (void)tabBarController:(UITabBarController *)tabBarController
    didSelectViewController:(UIViewController *)viewController
{
  if (@available(iOS 18.0, *)) {
    return; // Reported by didSelectTab:.
  }
  for (RNUXTabComponentView *tab in _tabs) {
    if (tab.controller == viewController) {
      [self reportSelection:tab];
    }
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_tabs removeAllObjects];
  _accessory = nil;
  [self applyAccessory];
  [_tabBar setViewControllers:@[] animated:NO];
  _selectedId = @"";
}
@end
