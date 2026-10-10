#import "RNUXButtonComponentView.h"

#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@implementation RNUXButtonComponentView {
  UIButton *_button;
  NativeUIXButtonShadowNode::ConcreteState::Shared _sizeState;
  BOOL _primary;
  BOOL _destructive;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXButtonProps>();
    _button = [UIButton buttonWithType:UIButtonTypeSystem];
    _button.configuration = [self configurationForPrimary:NO destructive:NO];
    [_button addTarget:self action:@selector(didPress) forControlEvents:UIControlEventPrimaryActionTriggered];
    self.contentView = _button;
  }
  return self;
}

- (UIButtonConfiguration *)configurationForPrimary:(BOOL)primary destructive:(BOOL)destructive
{
  UIButtonConfiguration *configuration;
  if (@available(iOS 26.0, *)) {
    // Liquid Glass on systems that have it.
    configuration = primary ? [UIButtonConfiguration prominentGlassButtonConfiguration]
                            : [UIButtonConfiguration glassButtonConfiguration];
  } else {
    configuration = primary ? [UIButtonConfiguration filledButtonConfiguration]
                            : [UIButtonConfiguration grayButtonConfiguration];
    configuration.cornerStyle = UIButtonConfigurationCornerStyleCapsule;
  }
  configuration.buttonSize = UIButtonConfigurationSizeLarge;
  configuration.titleLineBreakMode = NSLineBreakByWordWrapping;
  if (destructive) {
    if (primary) {
      configuration.baseBackgroundColor = UIColor.systemRedColor;
      configuration.baseForegroundColor = UIColor.whiteColor;
    } else {
      configuration.baseForegroundColor = UIColor.systemRedColor;
    }
  }
  return configuration;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXButtonProps const>(props);
  BOOL primary = newProps.variant == NativeUIXButtonVariant::Primary;
  BOOL destructive = newProps.destructive;
  NSString *title = [NSString stringWithUTF8String:newProps.label.c_str()];

  // Re-assigning the configuration restarts UIKit's press and glass effects,
  // so only do it when something visible changed.
  BOOL styleChanged = primary != _primary || destructive != _destructive;
  if (styleChanged || ![_button.configuration.title isEqualToString:title]) {
    UIButtonConfiguration *configuration = styleChanged
      ? [self configurationForPrimary:primary destructive:destructive]
      : [_button.configuration copy];
    configuration.title = title;
    _button.configuration = configuration;
    _primary = primary;
    _destructive = destructive;
  }
  if (_button.enabled == newProps.disabled) {
    _button.enabled = !newProps.disabled;
  }
  _button.accessibilityLabel = newProps.accessibilityLabel.empty()
    ? nil
    : [NSString stringWithUTF8String:newProps.accessibilityLabel.c_str()];

  [super updateProps:props oldProps:oldProps];
}

// Expose UIKit's control, including its Button role and activation behavior.
// The Fabric wrapper must remain a container rather than hide that control.
- (BOOL)isAccessibilityElement
{
  return NO;
}

- (NSObject *)accessibilityElement
{
  return _button;
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

// Natural width, and the height needed at the current width.
- (void)updateMeasuredSize
{
  CGFloat width = self.bounds.size.width;
  CGSize natural = [_button sizeThatFits:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX)];
  CGSize fitted = width > 0 ? [_button sizeThatFits:CGSizeMake(width, CGFLOAT_MAX)] : natural;
  [self commitMeasuredSize:CGSizeMake(ceil(natural.width), ceil(MAX(fitted.height, natural.height)))];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _sizeState = std::static_pointer_cast<NativeUIXButtonShadowNode::ConcreteState const>(state);
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

- (void)didPress
{
  auto emitter = std::static_pointer_cast<NativeUIXButtonEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onButtonPress({NSDate.date.timeIntervalSince1970 * 1000});
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _sizeState.reset();
  _button.enabled = YES;
  _button.accessibilityLabel = nil;
}
// React Native sets the layout direction on this view only; UIKit subviews
// default to the app's direction, so pass it down.
- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  _button.semanticContentAttribute = self.semanticContentAttribute;
}

@end
