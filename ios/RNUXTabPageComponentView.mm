#import "RNUXTabPageComponentView.h"

#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@implementation RNUXTabPageComponentView {
  BOOL _requestedHidden;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTabPageComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTabPageProps>();
  }
  return self;
}

// React Native sets `hidden` when the layout's display type changes; keep that
// request and combine it with the container's selection.
- (void)setHidden:(BOOL)hidden
{
  _requestedHidden = hidden;
  [super setHidden:hidden || _inactive];
}

- (void)setInactive:(BOOL)inactive
{
  _inactive = inactive;
  [super setHidden:_requestedHidden || inactive];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXTabPageProps const>(props);
  _pageId = [NSString stringWithUTF8String:newProps.pageId.c_str()];
  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  self.inactive = NO;
}
@end
