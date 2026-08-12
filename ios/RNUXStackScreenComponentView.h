#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// One route of a NativeUIXStack. Its view controller is what
/// UINavigationController pushes; React content is mounted in it.
@interface RNUXStackScreenComponentView : RCTViewComponentView
@property (nonatomic, readonly) UIViewController *controller;
@property (nonatomic, readonly, copy) NSString *routeKey;
/// The route shows no navigation bar (it hosts its own, such as Tabs).
@property (nonatomic, readonly) BOOL headerHidden;
/// Pushed over a tab bar: the bar slides away with the push.
@property (nonatomic, readonly) BOOL hidesTabBar;
/// Starts a new stack presented modally: a page sheet, or full screen.
@property (nonatomic, readonly) BOOL presentsModally;
@property (nonatomic, readonly) UIModalPresentationStyle modalPresentationStyle;
/// Shown as the root of a presented stack: a close button runs this.
@property (nonatomic, copy, nullable) void (^closeHandler)(void);
/// Part of a navigation controller the stack set up; cleared once popped.
@property (nonatomic) BOOL inNavigation;
/// Set when the user popped this route natively, before React removes it.
@property (nonatomic) BOOL popped;
/// Points the navigation bar at this screen's first scroll view, so large
/// titles collapse and insets adjust with it.
- (void)updateContentScrollView;
/// Starts a newly found scroll view at its top, below the navigation bar.
- (void)settleContentScrollView;
/// Lays the route out at its controller's view size (smaller in a sheet).
- (void)updateSize;
/// Pads content outside a top scroll view below the navigation bar.
- (void)updateTopInset;
/// Replaces this screen's content in its controller with a snapshot, so a
/// route React removed keeps its look while UIKit animates it out.
- (void)detachLeavingSnapshot;
@end

NS_ASSUME_NONNULL_END
