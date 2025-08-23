#import "RNUXTransitionViewComponentView.h"

#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>
#import <react/renderer/components/NativeUIXSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

typedef NS_ENUM(NSInteger, RNUXMotion) {
  RNUXMotionCrossDissolve,
  RNUXMotionFadeThrough,
  RNUXMotionSharedAxisX,
  RNUXMotionNone,
};

/*
 * Animates children that React mounts and unmounts. Fabric removes an
 * unmounted view immediately, so the outgoing child is replaced by a snapshot
 * that animates out in an overlay above the React children.
 */
@interface RNUXTransitionViewComponentView () <RCTNativeUIXTransitionViewViewProtocol>
@end

@implementation RNUXTransitionViewComponentView {
  RNUXMotion _motion;
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
  switch (newProps.motion) {
    case NativeUIXTransitionViewMotion::FadeThrough:
      _motion = RNUXMotionFadeThrough;
      break;
    case NativeUIXTransitionViewMotion::SharedAxisX:
      _motion = RNUXMotionSharedAxisX;
      break;
    case NativeUIXTransitionViewMotion::None:
      _motion = RNUXMotionNone;
      break;
    default: {
      _motion = RNUXMotionCrossDissolve;
      break;
    }
  }
  [super updateProps:props oldProps:oldProps];
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTNativeUIXTransitionViewHandleCommand(self, commandName, args);
}

// Runs before the transaction that replaces children; Fabric may unmount the
// outgoing subtree's descendants before the subtree root.
- (void)prepareTransition
{
  [_preparedSnapshots removeAllObjects];
  if (![self shouldAnimate]) {
    return;
  }
  for (UIView *child in self.subviews) {
    if (child == _overlay) {
      continue;
    }
    UIView *snapshot = [child snapshotViewAfterScreenUpdates:NO];
    if (snapshot != nil) {
      [_preparedSnapshots setObject:snapshot forKey:child];
    }
  }
  // Kept until the replacing transaction mounts or unmounts a child (see
  // discardPreparedSnapshotsAfterTransaction), however long JS takes.
}

- (void)discardPreparedSnapshotsAfterTransaction
{
  if (_preparedSnapshots.count == 0) {
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_preparedSnapshots removeAllObjects];
  });
}

- (BOOL)shouldAnimate
{
  return _motion != RNUXMotionNone && self.window != nil && !CGRectIsEmpty(self.bounds);
}

- (RNUXMotion)effectiveMotion
{
  // Reduce Motion keeps a plain cross-dissolve, as UIKit does.
  return UIAccessibilityIsReduceMotionEnabled() ? RNUXMotionCrossDissolve : _motion;
}

- (CGFloat)forwardSign
{
  return self.effectiveUserInterfaceLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft ? -1 : 1;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  [self discardPreparedSnapshotsAfterTransaction];
  if (![self shouldAnimate]) {
    return;
  }
  UIView *child = childComponentView;
  CGAffineTransform original = child.transform;
  // React Native stores `opacity` in the layer; animate back to it, not to 1.
  CGFloat originalAlpha = child.alpha;
  switch ([self effectiveMotion]) {
    case RNUXMotionFadeThrough: {
      // Material fade through: incoming fades and scales in after the outgoing fades.
      child.alpha = 0;
      child.transform = CGAffineTransformConcat(original, CGAffineTransformMakeScale(0.92, 0.92));
      [UIView animateWithDuration:0.21
                            delay:0.09
                          options:UIViewAnimationOptionCurveEaseOut | UIViewAnimationOptionAllowUserInteraction
                       animations:^{
                         child.alpha = originalAlpha;
                         child.transform = original;
                       }
                       completion:nil];
      break;
    }
    case RNUXMotionSharedAxisX: {
      child.transform = CGAffineTransformConcat(
          original, CGAffineTransformMakeTranslation(self.bounds.size.width * [self forwardSign], 0));
      UISpringTimingParameters *spring = [[UISpringTimingParameters alloc] initWithDampingRatio:1];
      UIViewPropertyAnimator *animator = [[UIViewPropertyAnimator alloc] initWithDuration:0.35
                                                                         timingParameters:spring];
      [animator addAnimations:^{
        child.transform = original;
      }];
      [animator startAnimation];
      break;
    }
    default: {
      child.alpha = 0;
      [UIView animateWithDuration:0.25
                            delay:0
                          options:UIViewAnimationOptionAllowUserInteraction
                       animations:^{
                         child.alpha = originalAlpha;
                       }
                       completion:nil];
      break;
    }
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  UIView *prepared = [_preparedSnapshots objectForKey:childComponentView];
  [_preparedSnapshots removeObjectForKey:childComponentView];
  [self discardPreparedSnapshotsAfterTransaction];
  UIView *snapshot = nil;
  if ([self shouldAnimate]) {
    snapshot = prepared ?: [childComponentView snapshotViewAfterScreenUpdates:NO];
  }
  CGRect frame = childComponentView.frame;
  [super unmountChildComponentView:childComponentView index:index];
  if (snapshot == nil) {
    return;
  }
  snapshot.frame = frame;
  [[self overlay] addSubview:snapshot];

  void (^finish)(void) = ^{
    [snapshot removeFromSuperview];
    [self removeOverlayIfEmpty];
  };
  switch ([self effectiveMotion]) {
    case RNUXMotionFadeThrough: {
      [UIView animateWithDuration:0.09
          delay:0
          options:UIViewAnimationOptionCurveEaseIn
          animations:^{
            snapshot.alpha = 0;
          }
          completion:^(BOOL finished) {
            finish();
          }];
      break;
    }
    case RNUXMotionSharedAxisX: {
      UISpringTimingParameters *spring = [[UISpringTimingParameters alloc] initWithDampingRatio:1];
      UIViewPropertyAnimator *animator = [[UIViewPropertyAnimator alloc] initWithDuration:0.35
                                                                         timingParameters:spring];
      CGFloat shift = -0.3 * self.bounds.size.width * [self forwardSign];
      [animator addAnimations:^{
        snapshot.transform = CGAffineTransformMakeTranslation(shift, 0);
        snapshot.alpha = 0.6;
      }];
      [animator addCompletion:^(UIViewAnimatingPosition position) {
        finish();
      }];
      [animator startAnimation];
      break;
    }
    default: {
      [UIView animateWithDuration:0.25
          animations:^{
            snapshot.alpha = 0;
          }
          completion:^(BOOL finished) {
            finish();
          }];
      break;
    }
  }
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
