#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// A UINavigationController owned by Native UIX; React declares the routes.
@interface RNUXStackComponentView : RCTViewComponentView
@property (nonatomic, readonly) UINavigationController *stackNavigationController;
/// A container (a tab) shows the navigation controller itself, as UIKit's
/// tab bar controller expects; this view then only hosts the routes.
- (void)handOverToContainer;
/// Takes the navigation controller back from the container.
- (void)reclaimFromContainer;
@end

NS_ASSUME_NONNULL_END
