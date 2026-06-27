#import "RNUXTabComponentView.h"

#import "RNUXStackComponentView.h"

#import <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

static NSString *RNUXTabString(const std::string &value)
{
  return [NSString stringWithUTF8String:value.c_str()];
}

@implementation RNUXTabComponentView {
  UIViewController *_controller;
  RNUXStackComponentView *_stack;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXTabComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXTabProps>();
    [self makeController];
  }
  return self;
}

- (void)makeController
{
  _controller = [UIViewController new];
  _controller.view.backgroundColor = UIColor.systemBackgroundColor;
  [_controller.view addSubview:self];
  _tabId = @"";
}

// A tab whose content is a Stack gives UIKit the Stack's navigation
// controller, as a tab bar controller expects: re-selecting the tab pops to
// its root, the bar minimizes with its scroll view, and routes pushed with
// `hidesTabBar` slide the bar away.
- (UIViewController *)controller
{
  return _stack != nil ? _stack.stackNavigationController : _controller;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  if (index == 0 && [childComponentView isKindOfClass:RNUXStackComponentView.class]) {
    _stack = (RNUXStackComponentView *)childComponentView;
    [_stack handOverToContainer];
    [self applyItem];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (childComponentView == _stack) {
    [_stack reclaimFromContainer];
    _stack = nil;
    [self applyItem];
  }
  [super unmountChildComponentView:childComponentView index:index];
}

- (void)applyItem
{
  UITabBarItem *item = self.controller.tabBarItem;
  item.title = _title;
  item.image = _image;
  item.badgeValue = _badge;
  if (@available(iOS 18.0, *)) {
    UITab *tab = self.uiTab;
    if (tab != nil) {
      if (_title.length > 0) {
        tab.title = _title;
      }
      if (_image != nil) {
        tab.image = _image;
      }
      tab.badgeValue = _badge;
    }
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<NativeUIXTabProps const>(props);
  _tabId = RNUXTabString(next.tabId);
  _title = RNUXTabString(next.title);
  _image = next.iosIcon.empty() ? nil : [UIImage systemImageNamed:RNUXTabString(next.iosIcon)];
  _badge = next.badge.empty() ? nil : RNUXTabString(next.badge);
  _searchRole = next.tabRole == NativeUIXTabTabRole::Search;
  [self applyItem];
  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _stack = nil;
  self.uiTab = nil;
  if (self.superview == _controller.view) {
    [self removeFromSuperview];
  }
  [self makeController];
}
@end
