#import "RNUXTabContentComponentView.h"

#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

#import "RNUXTabPageComponentView.h"

using namespace facebook::react;

/*
 * Keeps every page mounted and shows the selected one, as UITabBarController
 * does. Inactive pages are hidden (see RNUXTabPageComponentView), so they keep
 * their state and leave the accessibility tree. `platform` motion is
 * no animation, as tab switches in UIKit are; the other intents use UIKit's
 * cross-dissolve.
 */
@implementation RNUXTabContentComponentView {
  NSString *_selectedId;
  BOOL _animates;
  // Mounted pages. React Native may move children into an inner container
  // (for example with `overflow: hidden` plus a shadow) and may reorder them
  // (zIndex), so pages are tracked here and matched by ID.
  NSMutableArray<RNUXTabPageComponentView *> *_pages;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTabContentComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTabContentProps>();
    _pages = [NSMutableArray new];
    self.clipsToBounds = YES;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXTabContentProps const>(props);
  _animates = newProps.motion == NativeUIXTabContentMotion::FadeThrough ||
      newProps.motion == NativeUIXTabContentMotion::SharedAxisX;
  NSString *selectedId = [NSString stringWithUTF8String:newProps.selectedId.c_str()];
  BOOL changed = ![selectedId isEqualToString:_selectedId ?: @""];
  _selectedId = selectedId;
  [super updateProps:props oldProps:oldProps];
  if (!changed) {
    return;
  }
  if (_animates && self.window != nil && !UIAccessibilityIsReduceMotionEnabled()) {
    [UIView transitionWithView:self
                      duration:0.3
                       options:UIViewAnimationOptionTransitionCrossDissolve | UIViewAnimationOptionAllowUserInteraction
                    animations:^{
                      [self applySelection];
                    }
                    completion:nil];
  } else {
    [self applySelection];
  }
}

- (void)applySelection
{
  for (RNUXTabPageComponentView *page in _pages) {
    page.inactive = ![page.pageId isEqualToString:_selectedId];
  }
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  if ([childComponentView isKindOfClass:[RNUXTabPageComponentView class]]) {
    [_pages addObject:(RNUXTabPageComponentView *)childComponentView];
  }
  [self applySelection];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super unmountChildComponentView:childComponentView index:index];
  if ([childComponentView isKindOfClass:[RNUXTabPageComponentView class]]) {
    [_pages removeObject:(RNUXTabPageComponentView *)childComponentView];
    ((RNUXTabPageComponentView *)childComponentView).inactive = NO;
  }
  [self applySelection];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_pages removeAllObjects];
  _selectedId = nil;
}
@end
