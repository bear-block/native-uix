#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

/// A sheet's content area; laid out at the size its sheet reports.
@interface RNUXSheetContentComponentView : RCTViewComponentView
- (void)reportSize:(CGSize)size;
@end
