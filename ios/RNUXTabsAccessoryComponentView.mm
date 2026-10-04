#import "RNUXTabsAccessoryComponentView.h"

#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@class RNUXTabsAccessoryHost;

@interface RNUXTabsAccessoryComponentView ()
- (void)hostDidLayout;
- (void)hostEnvironmentChanged;
@end

/// The view UIKit sizes as the accessory's content view.
@interface RNUXTabsAccessoryHost : UIView
@property (nonatomic, weak) RNUXTabsAccessoryComponentView *accessory;
@end

@implementation RNUXTabsAccessoryHost
- (void)layoutSubviews
{
  [super layoutSubviews];
  [self.accessory hostDidLayout];
}
@end

@implementation RNUXTabsAccessoryComponentView {
  RNUXTabsAccessoryHost *_host;
  NativeUIXTabsAccessoryShadowNode::ConcreteState::Shared _state;
  NSString *_placement;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTabsAccessoryComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTabsAccessoryProps>();
    [self makeHost];
  }
  return self;
}

- (void)makeHost
{
  _host = [RNUXTabsAccessoryHost new];
  _host.accessory = self;
  // On iPad the accessory floats at the bottom at its content's width; the
  // React content has none of its own, so it asks for a mini player's. On
  // iPhone UIKit stretches it across the bar, overriding this.
  NSLayoutConstraint *width = [_host.widthAnchor constraintEqualToConstant:420];
  width.priority = UILayoutPriorityDefaultHigh;
  width.active = YES;
  [_host addSubview:self];
  _placement = @"";
  if (@available(iOS 26.0, *)) {
    // Regular above the tab bar; inline beside it when it minimizes.
    [_host registerForTraitChanges:@[ UITraitTabAccessoryEnvironment.class ]
                        withTarget:self
                            action:@selector(hostEnvironmentChanged)];
  }
}

- (UIView *)hostView
{
  return _host;
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  [super updateState:state oldState:oldState];
  _state = std::static_pointer_cast<NativeUIXTabsAccessoryShadowNode::ConcreteState const>(state);
  [self hostDidLayout];
}

- (void)hostDidLayout
{
  CGSize size = _host.bounds.size;
  if (!_state || size.width <= 0 || size.height <= 0) {
    return;
  }
  auto current = _state->getData().size;
  if (fabs(current.width - size.width) < 0.5 && fabs(current.height - size.height) < 0.5) {
    return;
  }
  _state->updateState(NativeUIXStackScreenState{facebook::react::Size{size.width, size.height}, 0});
}

- (void)hostEnvironmentChanged
{
  if (@available(iOS 26.0, *)) {
    NSString *placement =
        _host.traitCollection.tabAccessoryEnvironment == UITabAccessoryEnvironmentInline ? @"inline" : @"regular";
    if ([placement isEqualToString:_placement]) {
      return;
    }
    _placement = placement;
    auto emitter = std::static_pointer_cast<NativeUIXTabsAccessoryEventEmitter const>(_eventEmitter);
    if (emitter) {
      emitter->onPlacementChange({std::string(placement.UTF8String)});
    }
  }
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];
  // Reports the placement it already has once React can receive it.
  if (_placement.length == 0) {
    [self hostEnvironmentChanged];
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  if (self.superview == _host) {
    [self removeFromSuperview];
  }
  [self makeHost];
}
@end
