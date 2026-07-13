#import "RNUXSheetContentComponentView.h"

#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@implementation RNUXSheetContentComponentView {
  NativeUIXSheetContentShadowNode::ConcreteState::Shared _state;
  CGSize _pendingSize;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXSheetContentComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXSheetContentProps>();
  }
  return self;
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  [super updateState:state oldState:oldState];
  _state = std::static_pointer_cast<NativeUIXSheetContentShadowNode::ConcreteState const>(state);
  if (!CGSizeEqualToSize(_pendingSize, CGSizeZero)) {
    [self reportSize:_pendingSize];
  }
}

- (void)reportSize:(CGSize)size
{
  _pendingSize = size;
  if (!_state || size.width <= 0 || size.height <= 0) {
    return;
  }
  auto current = _state->getData().size;
  if (fabs(current.width - size.width) < 0.5 && fabs(current.height - size.height) < 0.5) {
    return;
  }
  _state->updateState(NativeUIXStackScreenState{facebook::react::Size{size.width, size.height}, 0});
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _pendingSize = CGSizeZero;
}
@end
