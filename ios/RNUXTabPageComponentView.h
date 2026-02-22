#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

@interface RNUXTabPageComponentView : RCTViewComponentView

/// Set by the tab container; an inactive page stays hidden whatever React
/// Native's layout (for example a `display` change) asks for.
@property (nonatomic, assign) BOOL inactive;

/// The page's ID, matched against the container's `selectedId`.
@property (nonatomic, copy, readonly) NSString *pageId;

@end
