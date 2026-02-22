#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// One route of a NativeUIXStack. Its view controller is what
/// UINavigationController pushes; React content is mounted in it.
@interface RNUXStackScreenComponentView : RCTViewComponentView
@property (nonatomic, readonly) UIViewController *controller;
@property (nonatomic, readonly, copy) NSString *routeKey;
/// Set when the user popped this route natively, before React removes it.
@property (nonatomic) BOOL popped;
/// Points the navigation bar at this screen's first scroll view, so large
/// titles collapse and insets adjust with it.
- (void)updateContentScrollView;
/// Starts a newly found scroll view at its top, below the navigation bar.
- (void)settleContentScrollView;
/// Pads content outside a top scroll view below the navigation bar.
- (void)updateTopInset;
/// Replaces this screen's content in its controller with a snapshot, so a
/// route React removed keeps its look while UIKit animates it out.
- (void)detachLeavingSnapshot;
@end

NS_ASSUME_NONNULL_END
