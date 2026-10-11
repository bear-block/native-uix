#import "RNUXTextFieldComponentView.h"
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>
#import <react/renderer/components/NativeUIXSpec/RCTComponentViewHelpers.h>
using namespace facebook::react;
@interface RNUXTextFieldComponentView () <UITextFieldDelegate, RCTNativeUIXTextFieldViewProtocol>
@end
@implementation RNUXTextFieldComponentView {
  UITextField *_field;
  UILabel *_label;
  UILabel *_support;
  UIButton *_passwordButton;
  BOOL _secure;
  BOOL _passwordVisible;
  int _eventCount;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<NativeUIXTextFieldComponentDescriptor>();
}
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTextFieldProps>();
    _field = [UITextField new];
    _field.borderStyle = UITextBorderStyleNone;
    _field.font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody];
    _field.adjustsFontForContentSizeCategory = YES;
    _field.returnKeyType = UIReturnKeyDone;
    _field.delegate = self;
    [_field addTarget:self action:@selector(changed) forControlEvents:UIControlEventEditingChanged];
    _label = [UILabel new];
    _support = [UILabel new];
    for (UILabel *label in @[_label, _support]) {
      label.font = [UIFont preferredFontForTextStyle:UIFontTextStyleCaption1];
      label.adjustsFontForContentSizeCategory = YES;
      label.numberOfLines = 1;
      label.hidden = YES;
    }
    [_field setContentHuggingPriority:UILayoutPriorityDefaultLow forAxis:UILayoutConstraintAxisVertical];
    [_label setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisVertical];
    [_support setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisVertical];
    UIStackView *stack = [[UIStackView alloc] initWithArrangedSubviews:@[_label, _field, _support]];
    stack.axis = UILayoutConstraintAxisVertical;
    stack.spacing = 4;
    UIView *container = [UIView new];
    stack.translatesAutoresizingMaskIntoConstraints = NO;
    [container addSubview:stack];
    [NSLayoutConstraint activateConstraints:@[
      [stack.leadingAnchor constraintEqualToAnchor:container.leadingAnchor],
      [stack.trailingAnchor constraintEqualToAnchor:container.trailingAnchor],
      [stack.topAnchor constraintEqualToAnchor:container.topAnchor],
      [stack.bottomAnchor constraintEqualToAnchor:container.bottomAnchor],
    ]];
    _passwordButton = [UIButton buttonWithType:UIButtonTypeSystem];
    _passwordButton.frame = CGRectMake(0, 0, 44, 44);
    [_passwordButton addTarget:self action:@selector(togglePassword) forControlEvents:UIControlEventTouchUpInside];
    self.contentView = container;
  }
  return self;
}
- (BOOL)isAccessibilityElement { return NO; }
- (NSObject *)accessibilityElement { return _field; }
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  const auto &next = *std::static_pointer_cast<NativeUIXTextFieldProps const>(props);
  // Props set initial text only; revision-checked commands reconcile later edits.
  if (_eventCount == 0 && !_field.isFirstResponder) _field.text = [NSString stringWithUTF8String:next.value.c_str()];
  _field.placeholder = [NSString stringWithUTF8String:next.placeholder.c_str()];
  _field.enabled = !next.disabled;
  _field.borderStyle = next.variant == NativeUIXTextFieldVariant::Rounded
    ? UITextBorderStyleRoundedRect : UITextBorderStyleNone;
  _field.textColor = next.disabled ? UIColor.tertiaryLabelColor : UIColor.labelColor;
  _label.text = [NSString stringWithUTF8String:next.label.c_str()];
  _label.hidden = next.label.empty();
  NSString *error = [NSString stringWithUTF8String:next.error.c_str()];
  _support.text = error.length ? error : [NSString stringWithUTF8String:next.helperText.c_str()];
  _support.hidden = _support.text.length == 0;
  _support.textColor = error.length ? UIColor.systemRedColor : UIColor.secondaryLabelColor;
  _label.textColor = error.length ? UIColor.systemRedColor : UIColor.labelColor;
  _field.accessibilityLabel = _label.hidden ? _field.placeholder : _label.text;
  _field.accessibilityHint = _support.text;
  _passwordButton.enabled = !next.disabled;
  if (_secure != next.secure) {
    _secure = next.secure;
    _passwordVisible = NO;
  }
  if (!next.passwordToggle) _passwordVisible = NO;
  [self applyPasswordVisibility];
  _field.rightView = _secure && next.passwordToggle ? _passwordButton : nil;
  _field.rightViewMode = UITextFieldViewModeAlways;
  [super updateProps:props oldProps:oldProps];
}
- (void)applyPasswordVisibility {
  BOOL obscured = _secure && !_passwordVisible;
  if (_field.secureTextEntry != obscured) {
    // Changing secure entry can reset UIKit's selection. Preserve both endpoints.
    UITextRange *selection = _field.selectedTextRange;
    NSInteger start = selection ? [_field offsetFromPosition:_field.beginningOfDocument toPosition:selection.start] : 0;
    NSInteger end = selection ? [_field offsetFromPosition:_field.beginningOfDocument toPosition:selection.end] : start;
    NSString *text = _field.text ?: @"";
    _field.secureTextEntry = obscured;
    _field.text = text;
    UITextPosition *a = [_field positionFromPosition:_field.beginningOfDocument offset:MIN(start, text.length)];
    UITextPosition *b = [_field positionFromPosition:_field.beginningOfDocument offset:MIN(end, text.length)];
    if (a && b) _field.selectedTextRange = [_field textRangeFromPosition:a toPosition:b];
  }
  [_passwordButton setImage:[UIImage systemImageNamed:_passwordVisible ? @"eye.slash" : @"eye"] forState:UIControlStateNormal];
  _passwordButton.accessibilityLabel = _passwordVisible ? @"Hide password" : @"Show password";
}
- (void)togglePassword {
  _passwordVisible = !_passwordVisible;
  [self applyPasswordVisibility];
}
- (void)changed {
  if (_field.markedTextRange != nil) return;
  _eventCount++;
  auto emitter = std::static_pointer_cast<NativeUIXTextFieldEventEmitter const>(_eventEmitter);
  if (emitter) emitter->onTextChange({std::string((_field.text ?: @"").UTF8String), _eventCount});
}
- (void)reconcile:(NSString *)value eventCount:(NSInteger)eventCount {
  if (eventCount != _eventCount || _field.markedTextRange != nil || [_field.text isEqualToString:value]) return;
  UITextRange *selection = _field.selectedTextRange;
  NSInteger offset = selection ? [_field offsetFromPosition:_field.beginningOfDocument toPosition:selection.start] : value.length;
  _field.text = value;
  UITextPosition *position = [_field positionFromPosition:_field.beginningOfDocument offset:MIN(offset, value.length)];
  if (position) _field.selectedTextRange = [_field textRangeFromPosition:position toPosition:position];
}
- (void)focus { if (_field.enabled) [_field becomeFirstResponder]; }
- (void)blur { [_field resignFirstResponder]; }
- (void)handleCommand:(NSString const *)commandName args:(NSArray const *)args {
  RCTNativeUIXTextFieldHandleCommand(self, commandName, args);
}
- (void)emitFocus:(BOOL)focused {
  auto emitter = std::static_pointer_cast<NativeUIXTextFieldEventEmitter const>(_eventEmitter);
  if (emitter) emitter->onFieldFocus({focused});
}
- (void)textFieldDidBeginEditing:(UITextField *)textField { [self emitFocus:YES]; }
- (void)textFieldDidEndEditing:(UITextField *)textField { [self emitFocus:NO]; }
- (BOOL)textFieldShouldReturn:(UITextField *)textField {
  auto emitter = std::static_pointer_cast<NativeUIXTextFieldEventEmitter const>(_eventEmitter);
  if (emitter) emitter->onFieldSubmit({std::string((_field.text ?: @"").UTF8String)});
  [_field resignFirstResponder];
  return YES;
}
- (void)prepareForRecycle {
  [_field resignFirstResponder];
  [super prepareForRecycle];
  _eventCount = 0;
  _secure = NO;
  _passwordVisible = NO;
  _field.secureTextEntry = NO;
  _field.rightView = nil;
  _field.text = @"";
}
@end
