#import "RNUXTransitionViewComponentView.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTMountingTransactionObserving.h>
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>
#import <react/renderer/components/NativeUIXSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

// UIKit has no fade-through or shared-axis content transition; every animated
// intent uses its cross-dissolve. Push and pop motion belongs to the app's
// native navigator, not to this view.
static const NSTimeInterval kCrossDissolveDuration = 0.3;

/*
 * Cross-dissolves when React adds or removes children. Just before the
 * mounting transaction runs, the view takes a snapshot of what is on screen
 * right now (including a transition still in progress), places it above the
 * children and fades it out, while the new children appear at full opacity
 * below it; image over content at fading alpha is a linear cross-dissolve.
 * No child opacity is animated, so Liquid Glass and other visual effects render
 * correctly, and an interrupted transition continues from what is visible
 * instead of jumping to the last committed state, as a `CATransition` would.
 */
@interface RNUXTransitionViewComponentView () <RCTNativeUIXTransitionViewViewProtocol, RCTMountingTransactionObserving>
@end

@implementation RNUXTransitionViewComponentView {
  BOOL _animates;
  UIView *_snapshot;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTransitionViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTransitionViewProps>();
    _animates = YES;
    self.clipsToBounds = YES;
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

// Android needs the command to snapshot outgoing children; iOS does not.
- (void)prepareTransition
{
}

// The transition must be added in the same Core Animation transaction as the
// child changes, so it is added just before this mounting transaction runs.
- (void)mountingTransactionWillMount:(MountingTransaction const &)transaction
                withSurfaceTelemetry:(SurfaceTelemetry const &)surfaceTelemetry
{
  if (self.window == nil || CGRectIsEmpty(self.bounds)) {
    return;
  }
  // Props in this transaction are not applied yet; a `motion` change that
  // arrives together with the new children must decide this transition.
  BOOL animates = _animates;
  BOOL changesChildren = NO;
  for (const auto &mutation : transaction.getMutations()) {
    if (mutation.type == ShadowViewMutation::Update && mutation.newChildShadowView.tag == self.tag) {
      auto props = std::static_pointer_cast<NativeUIXTransitionViewProps const>(mutation.newChildShadowView.props);
      if (props) {
        animates = props->motion != NativeUIXTransitionViewMotion::None;
      }
    } else if (
        (mutation.type == ShadowViewMutation::Insert || mutation.type == ShadowViewMutation::Remove) &&
        mutation.parentTag == self.tag) {
      changesChildren = YES;
    }
  }
  if (animates && changesChildren) {
    [self crossDissolveFromScreen];
  }
}

- (void)crossDissolveFromScreen
{
  // The render server's copy of what is visible now, including a fade still
  // in progress; about 1 ms, where rasterizing the hierarchy took 30-40 ms on
  // the main thread and dropped the first frames of the fade.
  UIView *snapshot = [self snapshotViewAfterScreenUpdates:NO];
  if (snapshot == nil) {
    return;
  }
  [self removeSnapshot];
  // Only the snapshot's layer joins this view: a subview would enter React
  // Native's child bookkeeping (indexes, removeClippedSubviews tracking).
  _snapshot = snapshot;
  CALayer *layer = snapshot.layer;
  layer.frame = self.layer.bounds;
  layer.zPosition = CGFLOAT_MAX;
  [self.layer addSublayer:layer];

  [CATransaction begin];
  [CATransaction setCompletionBlock:^{
    if (self->_snapshot == snapshot) {
      [self removeSnapshot];
    }
  }];
  CABasicAnimation *fade = [CABasicAnimation animationWithKeyPath:@"opacity"];
  fade.fromValue = @1;
  fade.toValue = @0;
  fade.duration = kCrossDissolveDuration;
  fade.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
  layer.opacity = 0;
  [layer addAnimation:fade forKey:@"opacity"];
  [CATransaction commit];
}

- (void)removeSnapshot
{
  [_snapshot.layer removeFromSuperlayer];
  _snapshot = nil;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self removeSnapshot];
  _animates = YES;
}
@end
