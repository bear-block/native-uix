#import "RNUXSheetComponentView.h"

#import <React/RCTSurfaceTouchHandler.h>

#import "RNUXSheetContentComponentView.h"
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@interface RNUXSheetController : UIViewController
@property (nonatomic, copy) void (^onBoundsChange)(CGSize size);
@end

@implementation RNUXSheetController {
  RCTSurfaceTouchHandler *_touchHandler;
  CGSize _lastSize;
}

- (void)loadView
{
  self.view = [UIView new];
  self.view.backgroundColor = UIColor.systemBackgroundColor;
  // The view is outside React Native's root view; it needs its own touch
  // handler, as React Native's Modal has.
  _touchHandler = [RCTSurfaceTouchHandler new];
  [_touchHandler attachToView:self.view];
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  CGSize size = self.view.bounds.size;
  if (!CGSizeEqualToSize(size, _lastSize)) {
    _lastSize = size;
    if (self.onBoundsChange) {
      self.onBoundsChange(size);
    }
  }
}
@end

@interface RNUXSheetComponentView () <UISheetPresentationControllerDelegate>
@end

@implementation RNUXSheetComponentView {
  RNUXSheetController *_controller;
  RNUXSheetContentComponentView *_content;
  CGSize _size;
  BOOL _open;
  BOOL _presented;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXSheetComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXSheetProps>();
    [self makeController];
  }
  return self;
}

- (void)makeController
{
  _controller = [RNUXSheetController new];
  _controller.modalPresentationStyle = UIModalPresentationPageSheet;
  __weak RNUXSheetComponentView *weakSelf = self;
  _controller.onBoundsChange = ^(CGSize size) {
    [weakSelf reportSize:size];
  };
}

- (void)reportSize:(CGSize)size
{
  _size = size;
  [_content reportSize:size];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_controller.view insertSubview:childComponentView atIndex:index];
  if ([childComponentView isKindOfClass:RNUXSheetContentComponentView.class]) {
    _content = (RNUXSheetContentComponentView *)childComponentView;
    if (_size.width > 0) {
      [_content reportSize:_size];
    }
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (childComponentView == _content) {
    _content = nil;
  }
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<NativeUIXSheetProps const>(props);
  UISheetPresentationController *sheet = _controller.sheetPresentationController;
  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray new];
  for (const auto &detent : next.detents) {
    if (detent == "medium") {
      [detents addObject:UISheetPresentationControllerDetent.mediumDetent];
    } else if (detent == "large") {
      [detents addObject:UISheetPresentationControllerDetent.largeDetent];
    }
  }
  if (detents.count == 0) {
    [detents addObject:UISheetPresentationControllerDetent.largeDetent];
  }
  sheet.delegate = self;
  sheet.detents = detents;
  sheet.prefersGrabberVisible = next.grabber;
  // The first detent is where the sheet opens.
  if (!_presented) {
    sheet.selectedDetentIdentifier = detents.firstObject.identifier;
  }
  _controller.modalInPresentation = !next.dismissible;
  _open = next.open;
  [super updateProps:props oldProps:oldProps];
  [self applyPresentation];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self applyPresentation];
}

- (UIViewController *)presenter
{
  UIResponder *responder = self.superview;
  while (responder != nil && ![responder isKindOfClass:UIViewController.class]) {
    responder = responder.nextResponder;
  }
  UIViewController *presenter = (UIViewController *)responder ?: self.window.rootViewController;
  // A controller already presenting something presents from the top.
  while (presenter.presentedViewController != nil && presenter.presentedViewController != _controller) {
    presenter = presenter.presentedViewController;
  }
  return presenter;
}

- (void)applyPresentation
{
  if (_open && !_presented && self.window != nil) {
    UIViewController *presenter = [self presenter];
    if (presenter == nil) {
      return;
    }
    _presented = YES;
    [presenter presentViewController:_controller animated:YES completion:nil];
  } else if (!_open && _presented) {
    _presented = NO;
    // The children stay until React removes them, after the dismissal.
    [_controller dismissViewControllerAnimated:YES
                                    completion:^{
                                      [self emitDismiss];
                                    }];
  }
}

- (void)emitDismiss
{
  auto emitter = std::static_pointer_cast<NativeUIXSheetEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onDismiss({});
  }
}

#pragma mark - UISheetPresentationControllerDelegate

// Dismissed by the user (drag down): already gone, reported once.
- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  _presented = NO;
  [self emitDismiss];
}

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
    (UISheetPresentationController *)sheetPresentationController
{
  NSString *identifier = sheetPresentationController.selectedDetentIdentifier;
  NSString *detent = [identifier isEqualToString:UISheetPresentationControllerDetentIdentifierMedium] ? @"medium" : @"large";
  auto emitter = std::static_pointer_cast<NativeUIXSheetEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onDetentChange({std::string(detent.UTF8String)});
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  if (_presented) {
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }
  _presented = NO;
  _open = NO;
  _content = nil;
  _size = CGSizeZero;
  [self makeController];
}
@end
