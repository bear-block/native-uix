#import "RNUXScrollingListComponentView.h"

#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

#import "RNUXTablePosition.h"

using namespace facebook::react;

@interface RNUXScrollingListComponentView () <UITableViewDataSource, UITableViewDelegate>
@end

@implementation RNUXScrollingListComponentView {
  UITableView *_table;
  NSDictionary *_pendingPosition;
  NSArray<NSDictionary *> *_rows;
  NSArray<NSString *> *_sectionTitles;
  NSArray<NSArray<NSDictionary *> *> *_sections;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXScrollingListComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXScrollingListProps>();
    _rows = @[];
    _sections = @[];
    _sectionTitles = @[];
    [self installTableWithStyle:UITableViewStyleInsetGrouped];
  }
  return self;
}


- (void)installTableWithStyle:(UITableViewStyle)style
{
  _table.delegate = nil;
  _table.dataSource = nil;
  _table = [[UITableView alloc] initWithFrame:self.bounds style:style];
  _table.dataSource = self;
  _table.delegate = self;
  _table.semanticContentAttribute = self.semanticContentAttribute;
  _table.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
  _table.rowHeight = UITableViewAutomaticDimension;
  _table.estimatedRowHeight = 64;
  self.contentView = _table;
}

- (NSIndexPath *)indexForRowId:(NSString *)identity
{
  for (NSUInteger section = 0; section < _sections.count; section++) {
    for (NSUInteger row = 0; row < _sections[section].count; row++) {
      if ([_sections[section][row][@"id"] isEqualToString:identity]) return [NSIndexPath indexPathForRow:row inSection:section];
    }
  }
  return nil;
}
- (void)restorePendingPosition
{
  if (!_pendingPosition || self.bounds.size.height <= 0) return;
  RNUXRestoreTablePosition(_table, _pendingPosition, ^NSIndexPath *(NSString *identity) {
    return [self indexForRowId:identity];
  });
  _pendingPosition = nil;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<NativeUIXScrollingListProps const>(props);
  UITableViewStyle style = next.appearance == NativeUIXScrollingListAppearance::Plain ? UITableViewStylePlain
    : next.appearance == NativeUIXScrollingListAppearance::Grouped ? UITableViewStyleGrouped : UITableViewStyleInsetGrouped;
  BOOL appearanceChanged = _table.style != style;
  if (appearanceChanged) {
    _pendingPosition = RNUXCaptureTablePosition(_table, ^NSString *(NSIndexPath *path) { return _sections[path.section][path.row][@"id"]; });
    [self installTableWithStyle:style];
  }
  NSMutableArray<NSDictionary *> *rows = [NSMutableArray new];
  for (const auto &item : next.items) {
    [rows addObject:@{
      @"id" : [NSString stringWithUTF8String:item.id.c_str()],
      @"title" : [NSString stringWithUTF8String:item.title.c_str()],
      @"subtitle" : [NSString stringWithUTF8String:item.subtitle.c_str()],
      @"section" : [NSString stringWithUTF8String:item.section.c_str()],
      @"action" : @(item.action),
      @"disabled" : @(item.disabled),
    }];
  }
  if (appearanceChanged || ![_rows isEqualToArray:rows]) {
    [self setRows:rows];
    [_table reloadData];
  }
  if (_pendingPosition) RNUXRestoreTablePosition(_table, _pendingPosition, ^NSIndexPath *(NSString *identity) {
    return [self indexForRowId:identity];
  });
  [super updateProps:props oldProps:oldProps];
  [self setNeedsLayout];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self restorePendingPosition];
}

- (void)setRows:(NSArray<NSDictionary *> *)rows
{
  _rows = [rows copy];
  NSMutableArray<NSString *> *titles = [NSMutableArray new];
  NSMutableArray<NSMutableArray<NSDictionary *> *> *sections = [NSMutableArray new];
  for (NSDictionary *row in rows) {
    NSUInteger index = [titles indexOfObject:row[@"section"]];
    if (index == NSNotFound) {
      index = titles.count;
      [titles addObject:row[@"section"]];
      [sections addObject:[NSMutableArray new]];
    }
    [sections[index] addObject:row];
  }
  _sectionTitles = titles;
  _sections = sections;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return _sections.count;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return _sections[section].count;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
  NSString *title = _sectionTitles[section];
  return title.length > 0 ? title : nil;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"row"];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"row"];
  }
  NSDictionary *row = _sections[indexPath.section][indexPath.row];
  BOOL action = [row[@"action"] boolValue];
  BOOL disabled = [row[@"disabled"] boolValue];
  UIListContentConfiguration *content = [UIListContentConfiguration subtitleCellConfiguration];
  content.text = row[@"title"];
  NSString *subtitle = row[@"subtitle"];
  content.secondaryText = subtitle.length > 0 ? subtitle : nil;
  content.textProperties.color = disabled ? UIColor.tertiaryLabelColor : UIColor.labelColor;
  content.secondaryTextProperties.color = UIColor.secondaryLabelColor;
  cell.contentConfiguration = content;
  cell.selectionStyle = action && !disabled ? UITableViewCellSelectionStyleDefault : UITableViewCellSelectionStyleNone;
  cell.accessoryType = action ? UITableViewCellAccessoryDisclosureIndicator : UITableViewCellAccessoryNone;
  cell.accessibilityTraits = (action ? UIAccessibilityTraitButton : UIAccessibilityTraitStaticText) |
      (disabled ? UIAccessibilityTraitNotEnabled : 0);
  return cell;
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  NSDictionary *row = _sections[indexPath.section][indexPath.row];
  return [row[@"action"] boolValue] && ![row[@"disabled"] boolValue] ? indexPath : nil;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
  NSDictionary *row = _sections[indexPath.section][indexPath.row];
  auto emitter = std::static_pointer_cast<NativeUIXScrollingListEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onItemPress({std::string([row[@"id"] UTF8String])});
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _pendingPosition = nil;
  [self setRows:@[]];
  [_table reloadData];
  [_table setContentOffset:CGPointZero animated:NO];
}
@end
