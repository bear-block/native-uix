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
  int _eventCount;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<NativeUIXTextFieldComponentDescriptor>();
}
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTextFieldProps>();
    _field = [UITextField new];
    _field.borderStyle = UITextBorderStyleRoundedRect;
    _field.font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody];
    _field.adjustsFontForContentSizeCategory = YES;
    _field.returnKeyType = UIReturnKeyDone;
    _field.delegate = self;
    [_field addTarget:self action:@selector(changed) forControlEvents:UIControlEventEditingChanged];
    self.contentView = _field;
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
  if (_field.secureTextEntry != next.secure) _field.secureTextEntry = next.secure;
  [super updateProps:props oldProps:oldProps];
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
  _field.text = @"";
}
@end
