#import "RNUXStackComponentView.h"

#import <React/RCTMountingTransactionObserving.h>
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

#import "RNUXStackScreenComponentView.h"

using namespace facebook::react;

/*
 * React declares the routes; UIKit runs them. After each mounting transaction
 * the routes are split into stacks: the first, and one per modal route, which
 * UIKit presents over the stack before it in a navigation controller of its
 * own. Each stack is pushed, popped or set to its declared controllers, and
 * modals are presented or dismissed, one animated change at a time. A pop or
 * dismissal the user commits (back button, interactive swipe, close button,
 * swiping a sheet down) is reported once, after UIKit finishes it; a
 * cancelled swipe reports nothing.
 */
@interface RNUXStackComponentView () <RCTMountingTransactionObserving,
                                      UINavigationControllerDelegate,
                                      UIAdaptivePresentationControllerDelegate>
@end

@implementation RNUXStackComponentView {
  UINavigationController *_navigation;
  /// Presented stacks, each over the one before it.
  NSMutableArray<UINavigationController *> *_modals;
  NSMutableArray<RNUXStackScreenComponentView *> *_screens;
  BOOL _handedOver;
  /// A modal is being presented or dismissed; routes apply after it.
  BOOL _presenting;
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
    _modals = [NSMutableArray new];
    _navigation = [self makeNavigationController];
    self.contentView = _navigation.view;
  }
  return self;
}

- (UINavigationController *)makeNavigationController
{
  UINavigationController *navigation = [UINavigationController new];
  navigation.delegate = self;
  navigation.navigationBar.prefersLargeTitles = YES;
  return navigation;
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
  screen.closeHandler = nil;
  if (screen.popped) {
    [screen removeFromSuperview];
  } else {
    // Still in a navigation controller: UIKit animates its controller out
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

/// The declared routes split into stacks: the first, then one per modal route.
- (NSArray<NSArray<RNUXStackScreenComponentView *> *> *)declaredStacks
{
  NSMutableArray<NSMutableArray<RNUXStackScreenComponentView *> *> *stacks = [NSMutableArray new];
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (screen.popped) {
      continue;
    }
    if (stacks.count == 0 || screen.presentsModally) {
      [stacks addObject:[NSMutableArray new]];
    }
    [stacks.lastObject addObject:screen];
  }
  return stacks;
}

- (NSArray<UINavigationController *> *)navigationControllers
{
  return [@[ _navigation ] arrayByAddingObjectsFromArray:_modals];
}

- (RNUXStackScreenComponentView *)screenForController:(UIViewController *)controller
{
  for (RNUXStackScreenComponentView *screen in _screens) {
    if (screen.controller == controller) {
      return screen;
    }
  }
  return nil;
}

/// Applies the routes again once a navigation controller's transition ends.
- (BOOL)deferUntilTransitionEnds:(UINavigationController *)navigation
{
  id<UIViewControllerTransitionCoordinator> coordinator = navigation.transitionCoordinator;
  if (coordinator == nil) {
    return NO;
  }
  __weak RNUXStackComponentView *weakSelf = self;
  [coordinator animateAlongsideTransition:nil
                               completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
                                 [weakSelf applyRoutes];
                               }];
  return YES;
}

- (void)applyRoutes
{
  // Changing a stack mid-transition corrupts it; apply once it ends.
  if (_presenting) {
    return;
  }
  NSArray<UINavigationController *> *navigations = [self navigationControllers];
  for (UINavigationController *navigation in navigations) {
    if ([self deferUntilTransitionEnds:navigation]) {
      return;
    }
  }
  NSArray<NSArray<RNUXStackScreenComponentView *> *> *stacks = [self declaredStacks];

  // Modals whose route React removed (or replaced) are dismissed, with any
  // presented over them.
  NSUInteger kept = 0;
  while (kept < _modals.count && kept + 1 < stacks.count &&
         _modals[kept].viewControllers.firstObject == stacks[kept + 1].firstObject.controller) {
    kept += 1;
  }
  if (kept < _modals.count) {
    UINavigationController *modal = _modals[kept];
    [_modals removeObjectsInRange:NSMakeRange(kept, _modals.count - kept)];
    [self dismissModal:modal animated:modal.view.window != nil completion:nil];
    return;
  }

  for (NSUInteger i = 0; i < navigations.count; i++) {
    NSArray<RNUXStackScreenComponentView *> *stack = i < stacks.count ? stacks[i] : @[];
    [self applyStack:stack toNavigationController:navigations[i]];
    if ([self deferUntilTransitionEnds:navigations[i]]) {
      return;
    }
  }

  if (stacks.count > navigations.count) {
    [self presentStack:stacks[navigations.count] over:navigations.lastObject];
  }
}

- (void)applyStack:(NSArray<RNUXStackScreenComponentView *> *)stack
    toNavigationController:(UINavigationController *)navigation
{
  NSMutableArray<UIViewController *> *declared = [NSMutableArray new];
  for (RNUXStackScreenComponentView *screen in stack) {
    [declared addObject:screen.controller];
    screen.inNavigation = YES;
  }
  if ([declared isEqualToArray:navigation.viewControllers]) {
    return;
  }
  // Initial/restored histories may be installed before appearance callbacks.
  // Apply the top route's bar visibility before UIKit lays out its content.
  [navigation setNavigationBarHidden:stack.lastObject.headerHidden animated:NO];
  NSArray<UIViewController *> *current = navigation.viewControllers;
  BOOL animated = navigation.view.window != nil && current.count > 0 && declared.count > 0;
  // Push and pop through their own calls where the change is one of those,
  // so UIKit runs everything it ties to them (hidesBottomBarWhenPushed).
  if (current.count > 0 && declared.count == current.count + 1 &&
      [[declared subarrayWithRange:NSMakeRange(0, current.count)] isEqualToArray:current]) {
    [navigation pushViewController:declared.lastObject animated:animated];
  } else if (declared.count > 0 && declared.count < current.count &&
             [[current subarrayWithRange:NSMakeRange(0, declared.count)] isEqualToArray:declared]) {
    [navigation popToViewController:declared.lastObject animated:animated];
  } else {
    [navigation setViewControllers:declared animated:animated];
  }
}

- (void)presentStack:(NSArray<RNUXStackScreenComponentView *> *)stack over:(UINavigationController *)presenter
{
  // Presented once the stack below is on screen (its didShow applies again).
  if (presenter.view.window == nil || presenter.presentedViewController != nil) {
    return;
  }
  RNUXStackScreenComponentView *root = stack.firstObject;
  UINavigationController *modal = [self makeNavigationController];
  modal.modalPresentationStyle = root.modalPresentationStyle;
  NSMutableArray<UIViewController *> *controllers = [NSMutableArray new];
  for (RNUXStackScreenComponentView *screen in stack) {
    [controllers addObject:screen.controller];
    screen.inNavigation = YES;
  }
  [modal setViewControllers:controllers animated:NO];
  [modal setNavigationBarHidden:stack.lastObject.headerHidden animated:NO];
  // Swiping a page sheet down is reported like a native pop.
  modal.presentationController.delegate = self;
  __weak RNUXStackComponentView *weakSelf = self;
  __weak UINavigationController *weakModal = modal;
  root.closeHandler = ^{
    [weakSelf closeModal:weakModal];
  };
  [_modals addObject:modal];
  _presenting = YES;
  [presenter presentViewController:modal
                          animated:YES
                        completion:^{
                          RNUXStackComponentView *strongSelf = weakSelf;
                          if (strongSelf != nil) {
                            strongSelf->_presenting = NO;
                            [strongSelf applyRoutes];
                          }
                        }];
}

- (void)dismissModal:(UINavigationController *)modal
            animated:(BOOL)animated
          completion:(void (^_Nullable)(void))completion
{
  UIViewController *presenter = modal.presentingViewController;
  if (presenter == nil) {
    if (completion != nil) {
      completion();
    }
    [self applyRoutes];
    return;
  }
  _presenting = YES;
  __weak RNUXStackComponentView *weakSelf = self;
  [presenter dismissViewControllerAnimated:animated
                                completion:^{
                                  RNUXStackComponentView *strongSelf = weakSelf;
                                  if (strongSelf == nil) {
                                    return;
                                  }
                                  strongSelf->_presenting = NO;
                                  if (completion != nil) {
                                    completion();
                                  }
                                  [strongSelf applyRoutes];
                                }];
}

/// The close button of a modal's first route.
- (void)closeModal:(UINavigationController *)modal
{
  NSUInteger index = [_modals indexOfObject:modal];
  if (modal == nil || index == NSNotFound || _presenting) {
    return;
  }
  __weak RNUXStackComponentView *weakSelf = self;
  [self dismissModal:modal
            animated:YES
          completion:^{
            [weakSelf reportModalsDismissedFrom:modal];
          }];
}

/// Marks the routes of `modal` and of every modal over it popped, and reports
/// the route on top of the stack below.
- (void)reportModalsDismissedFrom:(UINavigationController *)modal
{
  NSUInteger index = [_modals indexOfObject:modal];
  if (index == NSNotFound) {
    return;
  }
  NSArray<UINavigationController *> *gone = [_modals subarrayWithRange:NSMakeRange(index, _modals.count - index)];
  [_modals removeObjectsInRange:NSMakeRange(index, _modals.count - index)];
  for (UINavigationController *navigation in gone) {
    for (UIViewController *controller in navigation.viewControllers) {
      RNUXStackScreenComponentView *screen = [self screenForController:controller];
      screen.popped = YES;
      screen.inNavigation = NO;
    }
  }
  UINavigationController *below = [self navigationControllers].lastObject;
  [self emitNativePopWithTop:[self screenForController:below.viewControllers.lastObject]];
}

- (void)emitNativePopWithTop:(RNUXStackScreenComponentView *)top
{
  auto emitter = std::static_pointer_cast<NativeUIXStackEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onNativePop({std::string((top.routeKey ?: @"").UTF8String)});
  }
}

#pragma mark - UIAdaptivePresentationControllerDelegate

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  [self reportModalsDismissedFrom:(UINavigationController *)presentationController.presentedViewController];
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
    if (!screen.popped && screen.inNavigation && screen.controller.navigationController == nil &&
        ![shown containsObject:screen.controller]) {
      screen.popped = YES;
      screen.inNavigation = NO;
      poppedNatively = YES;
    }
  }
  if (poppedNatively) {
    [self emitNativePopWithTop:[self screenForController:shown.lastObject]];
  }
  // A modal waiting for this stack to be on screen is presented now.
  [self applyRoutes];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  if (_modals.firstObject.presentingViewController != nil) {
    [_modals.firstObject.presentingViewController dismissViewControllerAnimated:NO completion:nil];
  }
  [_modals removeAllObjects];
  _presenting = NO;
  [_screens removeAllObjects];
  [_navigation setViewControllers:@[] animated:NO];
  if (_handedOver) {
    [self reclaimFromContainer];
  }
}
@end
