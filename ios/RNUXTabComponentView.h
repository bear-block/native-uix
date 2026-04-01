#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// One tab of NativeUIXTabs; its view controller is a UITabBarController child.
@interface RNUXTabComponentView : RCTViewComponentView
@property (nonatomic, readonly) UIViewController *controller;
@property (nonatomic, readonly, copy) NSString *tabId;
@end

NS_ASSUME_NONNULL_END
