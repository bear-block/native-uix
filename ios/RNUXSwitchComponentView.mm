#import "RNUXSwitchComponentView.h"

#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>
#import <react/renderer/components/NativeUIXSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

static const CGFloat kSpacing = 12;
static const CGFloat kVerticalPadding = 8;
static const CGFloat kMinimumHeight = 44;

@interface RNUXSwitchComponentView () <RCTNativeUIXSwitchViewProtocol>
@end

@implementation RNUXSwitchComponentView {
  UILabel *_label;
  UISwitch *_switch;
  NativeUIXSwitchShadowNode::ConcreteState::Shared _sizeState;
  BOOL _hasAppliedValue;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXSwitchComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXSwitchProps>();
    _label = [UILabel new];
    _label.font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody];
    _label.adjustsFontForContentSizeCategory = YES;
    _label.numberOfLines = 0;
    _label.textColor = UIColor.labelColor;
    _switch = [UISwitch new];
    [_switch addTarget:self action:@selector(didToggle) forControlEvents:UIControlEventValueChanged];
    [self addSubview:_label];
    [self addSubview:_switch];
    // One accessible element: the switch, labelled with the row text.
    _label.isAccessibilityElement = NO;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXSwitchProps const>(props);
  NSString *text = [NSString stringWithUTF8String:newProps.label.c_str()];
  BOOL labelChanged = ![_label.text isEqualToString:text];
  _label.text = text;
  _label.enabled = !newProps.disabled;
  _switch.enabled = !newProps.disabled;
  if (_switch.on != newProps.value) {
    // The first value after mounting (or recycling) is not a change to animate.
    [_switch setOn:newProps.value animated:_hasAppliedValue];
  }
  _hasAppliedValue = YES;
  _switch.accessibilityLabel = newProps.accessibilityLabel.empty()
    ? text
    : [NSString stringWithUTF8String:newProps.accessibilityLabel.c_str()];
  [super updateProps:props oldProps:oldProps];
  if (labelChanged) {
    [self setNeedsLayout];
  }
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTNativeUIXSwitchHandleCommand(self, commandName, args);
}

- (void)setNativeValue:(BOOL)value
{
  if (_switch.on != value) {
    [_switch setOn:value animated:YES];
  }
}

- (CGSize)labelSizeForWidth:(CGFloat)width
{
  return [_label sizeThatFits:CGSizeMake(MAX(width, 0), CGFLOAT_MAX)];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  CGSize bounds = self.bounds.size;
  CGSize switchSize = [_switch sizeThatFits:CGSizeZero];
  CGFloat labelWidth = MAX(bounds.width - switchSize.width - kSpacing, 0);
  CGSize labelSize = [self labelSizeForWidth:labelWidth];
  BOOL rtl = self.effectiveUserInterfaceLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  CGFloat switchX = rtl ? 0 : bounds.width - switchSize.width;
  CGFloat labelX = rtl ? switchSize.width + kSpacing : 0;
  _switch.frame = CGRectMake(switchX, (bounds.height - switchSize.height) / 2, switchSize.width, switchSize.height);
  _label.frame = CGRectMake(labelX, (bounds.height - labelSize.height) / 2, labelWidth, labelSize.height);
  _label.textAlignment = NSTextAlignmentNatural;

  [self updateMeasuredSize];
}

- (void)updateMeasuredSize
{
  CGSize switchSize = [_switch sizeThatFits:CGSizeZero];
  CGFloat width = self.bounds.size.width;
  CGFloat naturalWidth = [self labelSizeForWidth:CGFLOAT_MAX].width + kSpacing + switchSize.width;
  CGFloat labelWidth = width > 0 ? MAX(width - switchSize.width - kSpacing, 0) : CGFLOAT_MAX;
  CGFloat labelHeight = [self labelSizeForWidth:labelWidth].height;
  CGFloat height = MAX(kMinimumHeight, MAX(labelHeight, switchSize.height) + 2 * kVerticalPadding);
  [self commitMeasuredSize:CGSizeMake(ceil(naturalWidth), ceil(height))];
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
  [self setNeedsLayout];
}

- (void)didToggle
{
  auto emitter = std::static_pointer_cast<NativeUIXSwitchEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onValueRequest({(bool)_switch.on});
  }
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _sizeState = std::static_pointer_cast<NativeUIXSwitchShadowNode::ConcreteState const>(state);
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
  _sizeState.reset();
  _hasAppliedValue = NO;
  [_switch setOn:NO animated:NO];
}
@end
