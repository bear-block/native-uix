#import "RNUXStackScreenComponentView.h"

#import <QuartzCore/QuartzCore.h>

#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@interface RNUXStackScreenController : UIViewController
@property (nonatomic, weak) RNUXStackScreenComponentView *screen;
@end

@implementation RNUXStackScreenController
- (void)loadView
{
  UIView *view = [UIView new];
  // Opaque, as native screens are: the outgoing screen must not show through
  // during a push.
  view.backgroundColor = UIColor.systemBackgroundColor;
  self.view = view;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  [self.screen updateContentScrollView];
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  [self.screen settleContentScrollView];
  [self.screen updateTopInset];
}
@end

static NSString *RNUXString(const std::string &value)
{
  return [NSString stringWithUTF8String:value.c_str()];
}

static UIScrollView *RNUXFirstScrollView(UIView *view)
{
  NSMutableArray<UIView *> *queue = [NSMutableArray arrayWithObject:view];
  while (queue.count > 0) {
    UIView *next = queue.firstObject;
    [queue removeObjectAtIndex:0];
    if ([next isKindOfClass:UIScrollView.class]) {
      return (UIScrollView *)next;
    }
    [queue addObjectsFromArray:next.subviews];
  }
  return nil;
}

@implementation RNUXStackScreenComponentView {
  RNUXStackScreenController *_controller;
  __weak UIScrollView *_settledScrollView;
  CFTimeInterval _settleUntil;
  NativeUIXStackScreenShadowNode::ConcreteState::Shared _state;
  CGFloat _topInset;
  NSString *_trailingId;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXStackScreenComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXStackScreenProps>();
    [self makeController];
  }
  return self;
}

- (void)makeController
{
  _controller = [RNUXStackScreenController new];
  _controller.screen = self;
  _controller.navigationItem.largeTitleDisplayMode = UINavigationItemLargeTitleDisplayModeAlways;
  [_controller.view addSubview:self];
  _routeKey = @"";
  _popped = NO;
}

- (UIViewController *)controller
{
  return _controller;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<NativeUIXStackScreenProps const>(props);
  _routeKey = RNUXString(next.routeKey);
  UINavigationItem *item = _controller.navigationItem;
  item.title = RNUXString(next.screenTitle);
  item.largeTitleDisplayMode = next.headerSize == NativeUIXStackScreenHeaderSize::Large
      ? UINavigationItemLargeTitleDisplayModeAlways
      : UINavigationItemLargeTitleDisplayModeNever;
  NSString *subtitle = next.headerSubtitle.empty() ? nil : RNUXString(next.headerSubtitle);
  if (@available(iOS 26.0, *)) {
    item.subtitle = subtitle;
  } else {
    item.prompt = subtitle;
  }

  NSString *trailingLabel = next.trailingLabel.empty() ? nil : RNUXString(next.trailingLabel);
  _trailingId = RNUXString(next.trailingId);
  if (trailingLabel == nil) {
    item.rightBarButtonItem = nil;
  } else if (![item.rightBarButtonItem.title isEqualToString:trailingLabel]) {
    item.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:trailingLabel
                                                               style:UIBarButtonItemStylePlain
                                                              target:self
                                                              action:@selector(trailingPressed)];
  }
  item.rightBarButtonItem.enabled = !next.trailingDisabled;
  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  [super updateState:state oldState:oldState];
  _state = std::static_pointer_cast<NativeUIXStackScreenShadowNode::ConcreteState const>(state);
  [self updateTopInset];
}

// Content under the navigation bar must stay clear of it unless a scroll view
// at the top of the screen takes the bar's inset itself, as UIKit lays out
// views against the safe area.
- (void)updateTopInset
{
  if (!_state || !_controller.isViewLoaded || CGRectIsEmpty(self.bounds)) {
    return;
  }
  // Measured without the padding last written, so applying it cannot change
  // the answer. The state read back may lag behind that write.
  UIScrollView *scrollView = RNUXFirstScrollView(self);
  CGFloat inset = _controller.view.safeAreaInsets.top;
  if (scrollView != nil) {
    // The frame's origin: a scroll view's own coordinates include its offset.
    CGFloat y = [scrollView.superview convertPoint:scrollView.frame.origin toView:self].y - _topInset;
    if (CGRectIsEmpty(scrollView.bounds) || y < -0.5 || y >= self.bounds.size.height) {
      return; // Not laid out yet.
    }
    if (y < 0.5) {
      inset = 0;
    }
  }
  if (fabs(_topInset - inset) < 0.5) {
    return;
  }
  _topInset = inset;
  _state->updateState(NativeUIXStackScreenState{_state->getData().size, static_cast<Float>(inset)});
}

- (void)trailingPressed
{
  auto emitter = std::static_pointer_cast<NativeUIXStackScreenEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onHeaderAction({std::string(_trailingId.UTF8String)});
  }
}

- (void)updateContentScrollView
{
  UIScrollView *scrollView = RNUXFirstScrollView(self);
  if ([_controller contentScrollViewForEdge:NSDirectionalRectEdgeTop] != scrollView) {
    [_controller setContentScrollView:scrollView forEdge:NSDirectionalRectEdgeTop];
  }
}

// React Native leaves a new scroll view at offset zero, which under the
// navigation bar's inset reads as scrolled down and collapses the large
// title. Until the user touches it, briefly after it appears, a scroll view
// is kept at its top while the bar and its inset settle, as UIKit starts its
// own scroll views.
- (void)settleContentScrollView
{
  UIScrollView *scrollView = (UIScrollView *)[_controller contentScrollViewForEdge:NSDirectionalRectEdgeTop];
  if (scrollView == nil || scrollView.window == nil) {
    return;
  }
  if (scrollView != _settledScrollView) {
    CGFloat y = scrollView.contentOffset.y;
    if (y != 0 && fabs(y + scrollView.adjustedContentInset.top) > 0.5) {
      return; // Already scrolled; leave it.
    }
    _settledScrollView = scrollView;
    _settleUntil = CACurrentMediaTime() + 0.5;
    if (_controller.navigationItem.largeTitleDisplayMode != UINavigationItemLargeTitleDisplayModeNever) {
      // Pulled past the top, the bar expands to its large title.
      [scrollView setContentOffset:CGPointMake(scrollView.contentOffset.x, -scrollView.adjustedContentInset.top - scrollView.bounds.size.height)
                          animated:NO];
      __weak RNUXStackScreenComponentView *weakSelf = self;
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf settleContentScrollView];
      });
      return;
    }
  }
  if (scrollView.isTracking || scrollView.isDragging || scrollView.isDecelerating ||
      CACurrentMediaTime() > _settleUntil) {
    return;
  }
  CGFloat top = -scrollView.adjustedContentInset.top;
  if (fabs(scrollView.contentOffset.y - top) > 0.5) {
    [scrollView setContentOffset:CGPointMake(scrollView.contentOffset.x, top) animated:NO];
  }
}

- (void)detachLeavingSnapshot
{
  if (self.window != nil) {
    UIView *snapshot = [self snapshotViewAfterScreenUpdates:NO];
    if (snapshot != nil) {
      snapshot.frame = self.frame;
      [_controller.view addSubview:snapshot];
    }
  }
  [self removeFromSuperview];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // The old controller may still be animating out of the stack; this view
  // starts over with a controller of its own.
  if (self.superview == _controller.view) {
    [self removeFromSuperview];
  }
  _state.reset();
  _topInset = 0;
  [self makeController];
}
@end
