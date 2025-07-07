#import "RNUXSegmentedControlComponentView.h"

#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>
#import <react/renderer/components/NativeUIXSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface RNUXSegmentedControlComponentView () <RCTNativeUIXSegmentedControlViewProtocol>
@end

@implementation RNUXSegmentedControlComponentView {
  UISegmentedControl *_control;
  NSArray<NSString *> *_labels;
  NativeUIXSegmentedControlShadowNode::ConcreteState::Shared _sizeState;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXSegmentedControlComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXSegmentedControlProps>();
    _labels = @[];
    _control = [UISegmentedControl new];
    [_control addTarget:self action:@selector(didChange) forControlEvents:UIControlEventValueChanged];
    self.contentView = _control;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXSegmentedControlProps const>(props);
  NSMutableArray<NSString *> *labels = [NSMutableArray new];
  for (const auto &label : newProps.labels) {
    [labels addObject:[NSString stringWithUTF8String:label.c_str()]];
  }
  // Rebuild segments only when labels change; touching them otherwise would
  // interrupt the selection animation the user just started.
  if (![labels isEqualToArray:_labels]) {
    [_control removeAllSegments];
    [labels enumerateObjectsUsingBlock:^(NSString *label, NSUInteger index, BOOL *stop) {
      [self->_control insertSegmentWithTitle:label atIndex:index animated:NO];
    }];
    _labels = labels;
    _control.selectedSegmentIndex = UISegmentedControlNoSegment;
  }
  [self applySelectedIndex:newProps.selectedIndex];
  if (_control.enabled == newProps.disabled) {
    _control.enabled = !newProps.disabled;
  }
  _control.accessibilityLabel = newProps.accessibilityLabel.empty()
    ? nil
    : [NSString stringWithUTF8String:newProps.accessibilityLabel.c_str()];
  [super updateProps:props oldProps:oldProps];
}

- (void)applySelectedIndex:(NSInteger)index
{
  NSInteger target = (index >= 0 && index < _control.numberOfSegments) ? index : UISegmentedControlNoSegment;
  if (_control.selectedSegmentIndex != target) {
    _control.selectedSegmentIndex = target;
  }
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTNativeUIXSegmentedControlHandleCommand(self, commandName, args);
}

- (void)setNativeSelectedIndex:(NSInteger)index
{
  [self applySelectedIndex:index];
}

- (void)didChange
{
  auto emitter = std::static_pointer_cast<NativeUIXSegmentedControlEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onSelectionRequest({(int)_control.selectedSegmentIndex});
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateMeasuredSize];
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
  [self updateMeasuredSize];
}

- (void)updateMeasuredSize
{
  CGSize size = [_control sizeThatFits:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX)];
  [self commitMeasuredSize:CGSizeMake(ceil(size.width), ceil(size.height))];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _sizeState = std::static_pointer_cast<NativeUIXSegmentedControlShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  [self updateMeasuredSize];
}

// Writes the control's real size into the shadow node; Yoga re-lays out from
// it in native code, without a React render.
- (void)commitMeasuredSize:(CGSize)size
{
  if (!_sizeState) {
    return;
  }
  auto current = _sizeState->getData().size;
  if (fabs(current.width - size.width) < 0.5 && fabs(current.height - size.height) < 0.5) {
    return;
  }
  _sizeState->updateState(NativeUIXSizeState{facebook::react::Size{size.width, size.height}});
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_control removeAllSegments];
  _labels = @[];
  _sizeState.reset();
}
// React Native sets the layout direction on this view only; UIKit subviews
// default to the app's direction, so pass it down.
- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  _control.semanticContentAttribute = self.semanticContentAttribute;
}

@end
