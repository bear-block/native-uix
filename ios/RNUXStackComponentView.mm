#import "RNUXStackComponentView.h"

#import <React/RCTMountingTransactionObserving.h>
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

#import "RNUXStackScreenComponentView.h"

using namespace facebook::react;

/*
 * React declares the routes; UIKit runs them. After each mounting transaction
 * the navigation controller is given the declared controllers, and
 * `setViewControllers:animated:` performs the native push or pop. A pop the
 * user commits (back button, interactive swipe) is reported once, after
 * UIKit finishes it; a cancelled swipe reports nothing.
 */
@interface RNUXStackComponentView () <RCTMountingTransactionObserving, UINavigationControllerDelegate>
@end

@implementation RNUXStackComponentView {
  UINavigationController *_navigation;
  NSMutableArray<RNUXStackScreenComponentView *> *_screens;
  BOOL _handedOver;
}

- (UINavigationController *)stackNavigationController
{
  return _navigation;
}

- (void)handOverToContainer
{
  _handedOver = YES;
  if (_navigation.parentViewController != nil) {
    [_navigation willMoveToParentViewController:nil];
    [_navigation removeFromParentViewController];
  }
  self.contentView = nil;
}

- (void)reclaimFromContainer
{
  _handedOver = NO;
  self.contentView = _navigation.view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXStackComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXStackProps>();
    _screens = [NSMutableArray new];
    _navigation = [UINavigationController new];
    _navigation.delegate = self;
    _navigation.navigationBar.prefersLargeTitles = YES;
    self.contentView = _navigation.view;
  }
  return self;
}

// The navigation controller joins the nearest view controller, so appearance
// callbacks, safe areas and trait changes reach the routes.
- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (_handedOver) {
    return;
  }
  if (self.window != nil && _navigation.parentViewController == nil) {
    UIResponder *responder = self.superview;
    while (responder != nil && ![responder isKindOfClass:UIViewController.class]) {
      responder = responder.nextResponder;
    }
    UIViewController *parent = (UIViewController *)responder;
    if (parent != nil) {
      [parent addChildViewController:_navigation];
      [_navigation didMoveToParentViewController:parent];
    }
  } else if (self.window == nil && _navigation.parentViewController != nil) {
    [_navigation willMoveToParentViewController:nil];
    [_navigation removeFromParentViewController];
  }
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // The screen lives in its own controller's view, not in this view.
  [_screens insertObject:(RNUXStackScreenComponentView *)childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  RNUXStackScreenComponentView *screen = (RNUXStackScreenComponentView *)childComponentView;
  [_screens removeObject:screen];
  if (screen.popped) {
    [screen removeFromSuperview];
  } else {
    // Still in the navigation controller: UIKit animates its controller out
    // after this transaction, showing the snapshot.
    [screen detachLeavingSnapshot];
  }
}

- (void)mountingTransactionDidMount:(MountingTransaction const &)transaction
               withSurfaceTelemetry:(SurfaceTelemetry const &)surfaceTelemetry
{
  // Scroll views first: UIKit decides the large-title state when it shows a
  // controller, from the scroll view it tracks.
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (!screen.popped) {
      [screen updateContentScrollView];
    }
  }
  [self applyRoutes];
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (!screen.popped) {
      [screen updateTopInset];
    }
  }
}

- (NSArray<UIViewController *> *)declaredControllers
{
  NSMutableArray<UIViewController *> *controllers = [NSMutableArray new];
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (!screen.popped) {
      [controllers addObject:screen.controller];
    }
  }
  return controllers;
}

- (void)applyRoutes
{
  NSArray<UIViewController *> *declared = [self declaredControllers];
  if ([declared isEqualToArray:_navigation.viewControllers]) {
    return;
  }
  // Changing the stack mid-transition corrupts it; apply once it ends.
  id<UIViewControllerTransitionCoordinator> coordinator = _navigation.transitionCoordinator;
  if (coordinator != nil) {
    __weak RNUXStackComponentView *weakSelf = self;
    [coordinator animateAlongsideTransition:nil
                                 completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
                                   [weakSelf applyRoutes];
                                 }];
    return;
  }
  NSArray<UIViewController *> *current = _navigation.viewControllers;
  BOOL animated = _navigation.view.window != nil && current.count > 0 && declared.count > 0;
  // Push and pop through their own calls where the change is one of those,
  // so UIKit runs everything it ties to them (hidesBottomBarWhenPushed).
  if (current.count > 0 && declared.count == current.count + 1 &&
      [[declared subarrayWithRange:NSMakeRange(0, current.count)] isEqualToArray:current]) {
    [_navigation pushViewController:declared.lastObject animated:animated];
  } else if (declared.count > 0 && declared.count < current.count &&
             [[current subarrayWithRange:NSMakeRange(0, declared.count)] isEqualToArray:declared]) {
    [_navigation popToViewController:declared.lastObject animated:animated];
  } else {
    [_navigation setViewControllers:declared animated:animated];
  }
}

#pragma mark - UINavigationControllerDelegate

// Each route decides whether the bar shows; UIKit animates it with the push
// or pop, and follows an interactive pop.
- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (screen.controller == viewController) {
      [navigationController setNavigationBarHidden:screen.headerHidden animated:animated];
    }
  }
}

- (void)navigationController:(UINavigationController *)navigationController
       didShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  NSArray<UIViewController *> *shown = navigationController.viewControllers;
  BOOL poppedNatively = NO;
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (!screen.popped && ![shown containsObject:screen.controller]) {
      screen.popped = YES;
      poppedNatively = YES;
    }
  }
  if (!poppedNatively) {
    return;
  }
  NSString *topKey = @"";
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (screen.controller == shown.lastObject) {
      topKey = screen.routeKey;
    }
  }
  auto emitter = std::static_pointer_cast<NativeUIXStackEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onNativePop({std::string(topKey.UTF8String)});
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_screens removeAllObjects];
  [_navigation setViewControllers:@[] animated:NO];
  if (_handedOver) {
    [self reclaimFromContainer];
  }
}
@end
