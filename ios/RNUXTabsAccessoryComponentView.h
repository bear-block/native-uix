#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// The Tabs accessory. Its React content lives in `hostView`, which the tab
/// bar controller lays out (iOS 26+); the content follows that size.
@interface RNUXTabsAccessoryComponentView : RCTViewComponentView
@property (nonatomic, readonly) UIView *hostView;
@end

NS_ASSUME_NONNULL_END
