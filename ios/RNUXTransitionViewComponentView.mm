#import "RNUXTransitionViewComponentView.h"

#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>
#import <react/renderer/components/NativeUIXSpec/RCTComponentViewHelpers.h>
#import <React/RCTMountingTransactionObserving.h>

using namespace facebook::react;

// UIKit has no fade-through or shared-axis content transition; every animated
// intent uses its cross-dissolve. Push and pop motion belongs to the app's
// native navigator, not to this view.
static const NSTimeInterval kCrossDissolveDuration = 0.3;

/*
 * Cross-dissolves children that React mounts and unmounts. Fabric removes an
 * unmounted view immediately, so the outgoing child is replaced by a snapshot
 * that fades out in an overlay above the React children.
 */
@interface RNUXTransitionViewComponentView () <RCTNativeUIXTransitionViewViewProtocol, RCTMountingTransactionObserving>
@end

@implementation RNUXTransitionViewComponentView {
  BOOL _animates;
  UIView *_overlay;
  NSMapTable<UIView *, UIView *> *_preparedSnapshots;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTransitionViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTransitionViewProps>();
    self.clipsToBounds = YES;
    _preparedSnapshots = [NSMapTable weakToStrongObjectsMapTable];
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXTransitionViewProps const>(props);
  _animates = newProps.motion != NativeUIXTransitionViewMotion::None;
  [super updateProps:props oldProps:oldProps];
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTNativeUIXTransitionViewHandleCommand(self, commandName, args);
}

// iOS does not need the command: React Native may mount a later revision
// before a queued command runs, so snapshots are taken in
// mountingTransactionWillMount instead, from the transaction's own mutations.
- (void)prepareTransition
{
}

// Fabric removes an outgoing subtree's descendants before its root; snapshot
// every child this transaction removes from this view while it is intact.
- (void)mountingTransactionWillMount:(MountingTransaction const &)transaction
                withSurfaceTelemetry:(SurfaceTelemetry const &)surfaceTelemetry
{
  [_preparedSnapshots removeAllObjects];
  if (![self shouldAnimate]) {
    return;
  }
  for (const auto &mutation : transaction.getMutations()) {
    if (mutation.type != ShadowViewMutation::Remove || mutation.parentTag != self.tag) {
      continue;
    }
    for (UIView *child in self.subviews) {
      if (child != _overlay && child.tag == mutation.oldChildShadowView.tag) {
        UIView *snapshot = [self staticSnapshotOf:child];
        if (snapshot != nil) {
          [_preparedSnapshots setObject:snapshot forKey:child];
        }
        break;
      }
    }
  }
}

- (void)mountingTransactionDidMount:(MountingTransaction const &)transaction
               withSurfaceTelemetry:(SurfaceTelemetry const &)surfaceTelemetry
{
  [_preparedSnapshots removeAllObjects];
}

// A static image: `snapshotViewAfterScreenUpdates:` returns a live replica of
// the render tree, which shows recycled or re-laid-out descendants once Fabric
// tears the outgoing subtree down.
- (UIView *)staticSnapshotOf:(UIView *)view
{
  if (CGRectIsEmpty(view.bounds)) {
    return nil;
  }
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithBounds:view.bounds format:format];
  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
    [view drawViewHierarchyInRect:view.bounds afterScreenUpdates:NO];
  }];
  return [[UIImageView alloc] initWithImage:image];
}

- (BOOL)shouldAnimate
{
  return _animates && self.window != nil && !CGRectIsEmpty(self.bounds);
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  if (![self shouldAnimate]) {
    return;
  }
  UIView *child = childComponentView;
  // React Native stores `opacity` in the layer; fade back to it, not to 1.
  CGFloat originalAlpha = child.alpha;
  child.alpha = 0;
  [UIView animateWithDuration:kCrossDissolveDuration
                        delay:0
                      options:UIViewAnimationOptionAllowUserInteraction
                   animations:^{
                     child.alpha = originalAlpha;
                   }
                   completion:nil];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  UIView *prepared = [_preparedSnapshots objectForKey:childComponentView];
  [_preparedSnapshots removeObjectForKey:childComponentView];
  UIView *snapshot = nil;
  if ([self shouldAnimate]) {
    snapshot = prepared ?: [self staticSnapshotOf:childComponentView];
  }
  CGRect frame = childComponentView.frame;
  [super unmountChildComponentView:childComponentView index:index];
  if (snapshot == nil) {
    return;
  }
  snapshot.frame = frame;
  [[self overlay] addSubview:snapshot];

  [UIView animateWithDuration:kCrossDissolveDuration
      animations:^{
        snapshot.alpha = 0;
      }
      completion:^(BOOL finished) {
        [snapshot removeFromSuperview];
        [self removeOverlayIfEmpty];
      }];
}

// The overlay is always the last subview, so React's child indexes stay valid.
- (UIView *)overlay
{
  if (_overlay == nil) {
    _overlay = [[UIView alloc] initWithFrame:self.bounds];
    _overlay.userInteractionEnabled = NO;
    _overlay.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  }
  if (_overlay.superview != self) {
    [self addSubview:_overlay];
  } else {
    [self bringSubviewToFront:_overlay];
  }
  return _overlay;
}

- (void)removeOverlayIfEmpty
{
  if (_overlay.subviews.count == 0) {
    [_overlay removeFromSuperview];
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_preparedSnapshots removeAllObjects];
  [_overlay.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];
  [_overlay removeFromSuperview];
}
@end
