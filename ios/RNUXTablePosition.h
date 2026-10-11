#import <UIKit/UIKit.h>

// Preserve a stable row and its distance from the visible content edge when
// UIKit requires a new table for an immutable style change.
static inline NSDictionary *RNUXCaptureTablePosition(UITableView *table, NSString *(^rowId)(NSIndexPath *)) {
  CGFloat top = -table.adjustedContentInset.top;
  NSIndexPath *anchor = [[table.indexPathsForVisibleRows sortedArrayUsingSelector:@selector(compare:)] firstObject];
  NSString *identity = anchor ? rowId(anchor) : nil;
  CGFloat distance = anchor ? [table rectForRowAtIndexPath:anchor].origin.y
    - table.contentOffset.y - table.adjustedContentInset.top : 0;
  return @{ @"top": @(table.contentOffset.y <= top + 0.5), @"id": identity ?: @"",
    @"distance": @(distance), @"offset": @(table.contentOffset.y) };
}
static inline void RNUXRestoreTablePosition(UITableView *table, NSDictionary *position, NSIndexPath *(^indexForId)(NSString *)) {
  [table layoutIfNeeded];
  CGFloat top = -table.adjustedContentInset.top;
  CGFloat y = [position[@"offset"] doubleValue];
  NSIndexPath *anchor = indexForId(position[@"id"]);
  if ([position[@"top"] boolValue]) y = top;
  else if (anchor) y = [table rectForRowAtIndexPath:anchor].origin.y
    - [position[@"distance"] doubleValue] - table.adjustedContentInset.top;
  CGFloat bottom = MAX(top, table.contentSize.height - table.bounds.size.height + table.adjustedContentInset.bottom);
  [table setContentOffset:CGPointMake(0, MIN(bottom, MAX(top, y))) animated:NO];
}
