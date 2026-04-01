#import "RNUXTabsComponentView.h"

#import <React/RCTMountingTransactionObserving.h>
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

#import "RNUXTabComponentView.h"

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
  [super updateProps:props oldProps:oldProps];
  [self applySelection];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // The tab lives in its own controller's view, not in this view.
  [_tabs insertObject:(RNUXTabComponentView *)childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_tabs removeObject:(RNUXTabComponentView *)childComponentView];
  [childComponentView removeFromSuperview];
}

- (void)mountingTransactionDidMount:(MountingTransaction const &)transaction
               withSurfaceTelemetry:(SurfaceTelemetry const &)surfaceTelemetry
{
  NSMutableArray<UIViewController *> *controllers = [NSMutableArray new];
  for (RNUXTabComponentView *tab in _tabs) {
    [controllers addObject:tab.controller];
  }
  if (![controllers isEqualToArray:_tabBar.viewControllers ?: @[]]) {
    [_tabBar setViewControllers:controllers animated:NO];
  }
  [self applySelection];
}

- (void)applySelection
{
  for (RNUXTabComponentView *tab in _tabs) {
    if ([tab.tabId isEqualToString:_selectedId] && _tabBar.selectedViewController != tab.controller &&
        [_tabBar.viewControllers containsObject:tab.controller]) {
      _tabBar.selectedViewController = tab.controller;
    }
  }
}

#pragma mark - UITabBarControllerDelegate

- (void)tabBarController:(UITabBarController *)tabBarController
    didSelectViewController:(UIViewController *)viewController
{
  for (RNUXTabComponentView *tab in _tabs) {
    if (tab.controller == viewController) {
      _selectedId = tab.tabId;
      auto emitter = std::static_pointer_cast<NativeUIXTabsEventEmitter const>(_eventEmitter);
      if (emitter) {
        emitter->onTabChange({std::string(tab.tabId.UTF8String)});
      }
    }
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_tabs removeAllObjects];
  [_tabBar setViewControllers:@[] animated:NO];
  _selectedId = @"";
}
@end
