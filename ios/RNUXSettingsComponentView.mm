#import "RNUXSettingsComponentView.h"

#import <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#import <react/renderer/components/NativeUIXSpec/Props.h>

using namespace facebook::react;

@interface RNUXSettingsRow : NSObject
@property (nonatomic, copy) NSString *rowId;
@property (nonatomic, copy) NSString *kind;
@property (nonatomic, copy) NSString *label;
@property (nonatomic) BOOL value;
@property (nonatomic) BOOL disabled;
@end

@implementation RNUXSettingsRow
@end

@interface RNUXSettingsSection : NSObject
@property (nonatomic, copy) NSString *title;
@property (nonatomic, strong) NSMutableArray<RNUXSettingsRow *> *rows;
@end

@implementation RNUXSettingsSection
@end

@interface RNUXSettingsComponentView () <UITableViewDataSource, UITableViewDelegate>
@end

static NSString *const kCellId = @"row";

@implementation RNUXSettingsComponentView {
  UITableView *_tableView;
  UILabel *_titleLabel;
  NSArray<RNUXSettingsSection *> *_sections;
  CGFloat _headerWidth;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<NativeUIXSettingsComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const NativeUIXSettingsProps>();
    _sections = @[];
    _tableView = [[UITableView alloc] initWithFrame:self.bounds style:UITableViewStyleInsetGrouped];
    _tableView.dataSource = self;
    _tableView.delegate = self;
    // React Native positions this view; do not add safe-area insets again.
    _tableView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    [_tableView registerClass:UITableViewCell.class forCellReuseIdentifier:kCellId];
    _titleLabel = [UILabel new];
    _titleLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleLargeTitle];
    _titleLabel.font = [UIFont fontWithDescriptor:[_titleLabel.font.fontDescriptor fontDescriptorWithSymbolicTraits:UIFontDescriptorTraitBold] size:0];
    _titleLabel.adjustsFontForContentSizeCategory = YES;
    _titleLabel.accessibilityTraits = UIAccessibilityTraitHeader;
    self.contentView = _tableView;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<NativeUIXSettingsProps const>(props);
  NSMutableArray<RNUXSettingsSection *> *sections = [NSMutableArray new];
  for (const auto &item : newProps.items) {
    NSString *kind = [NSString stringWithUTF8String:item.kind.c_str()];
    NSString *label = [NSString stringWithUTF8String:item.label.c_str()];
    if ([kind isEqualToString:@"header"]) {
      RNUXSettingsSection *section = [RNUXSettingsSection new];
      section.title = label.length > 0 ? label : nil;
      section.rows = [NSMutableArray new];
      [sections addObject:section];
      continue;
    }
    RNUXSettingsRow *row = [RNUXSettingsRow new];
    row.rowId = [NSString stringWithUTF8String:item.id.c_str()];
    row.kind = kind;
    row.label = label;
    row.value = item.value;
    row.disabled = item.disabled;
    [sections.lastObject.rows addObject:row];
  }
  BOOL sameStructure = _sections.count > 0 && [[self structureOf:sections] isEqualToString:[self structureOf:_sections]];
  _sections = sections;

  NSString *title = newProps.screenTitle.empty() ? nil : [NSString stringWithUTF8String:newProps.screenTitle.c_str()];
  _titleLabel.text = title;
  [self updateHeader];
  if (sameStructure) {
    // Same rows: update visible cells in place so native animations (a switch
    // that the user just toggled) are not cut off by a reload.
    for (NSIndexPath *indexPath in _tableView.indexPathsForVisibleRows) {
      UITableViewCell *cell = [_tableView cellForRowAtIndexPath:indexPath];
      if (cell != nil) {
        [self configureCell:cell row:[self rowAtIndexPath:indexPath] animated:YES];
      }
    }
  } else {
    [_tableView reloadData];
  }
  [super updateProps:props oldProps:oldProps];
}

// Row identity and order; values and labels are not part of it.
- (NSString *)structureOf:(NSArray<RNUXSettingsSection *> *)sections
{
  NSMutableString *key = [NSMutableString new];
  for (RNUXSettingsSection *section in sections) {
    [key appendFormat:@"[%@", section.title ?: @""];
    for (RNUXSettingsRow *row in section.rows) {
      [key appendFormat:@"|%@:%@", row.kind, row.rowId];
    }
    [key appendString:@"]"];
  }
  return key;
}

- (void)updateHeader
{
  if (_titleLabel.text.length == 0) {
    _tableView.tableHeaderView = nil;
    return;
  }
  CGFloat width = self.bounds.size.width;
  _headerWidth = width;
  if (width <= 0) {
    return;
  }
  CGFloat inset = 20;
  CGSize size = [_titleLabel sizeThatFits:CGSizeMake(width - 2 * inset, CGFLOAT_MAX)];
  UIView *header = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, size.height + 16)];
  _titleLabel.frame = CGRectMake(inset, 8, width - 2 * inset, size.height);
  [header addSubview:_titleLabel];
  _tableView.tableHeaderView = header;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (fabs(_headerWidth - self.bounds.size.width) > 0.5) {
    [self updateHeader];
  }
}

- (RNUXSettingsRow *)rowAtIndexPath:(NSIndexPath *)indexPath
{
  return _sections[indexPath.section].rows[indexPath.row];
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return _sections.count;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return _sections[section].rows.count;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
  return _sections[section].title;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kCellId forIndexPath:indexPath];
  [self configureCell:cell row:[self rowAtIndexPath:indexPath] animated:NO];
  return cell;
}

- (void)configureCell:(UITableViewCell *)cell row:(RNUXSettingsRow *)row animated:(BOOL)animated
{
  UIListContentConfiguration *content = [cell defaultContentConfiguration];
  content.text = row.label;
  content.textProperties.color = row.disabled ? UIColor.secondaryLabelColor : UIColor.labelColor;
  cell.contentConfiguration = content;

  if ([row.kind isEqualToString:@"switch"]) {
    UISwitch *toggle = [cell.accessoryView isKindOfClass:UISwitch.class] ? (UISwitch *)cell.accessoryView : [UISwitch new];
    [toggle removeTarget:nil action:NULL forControlEvents:UIControlEventAllEvents];
    [toggle addTarget:self action:@selector(didToggle:) forControlEvents:UIControlEventValueChanged];
    if (toggle.on != row.value) {
      [toggle setOn:row.value animated:animated];
    }
    toggle.enabled = !row.disabled;
    toggle.accessibilityLabel = row.label;
    cell.accessoryView = toggle;
    cell.accessoryType = UITableViewCellAccessoryNone;
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
  } else {
    cell.accessoryView = nil;
    cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
    cell.selectionStyle = row.disabled ? UITableViewCellSelectionStyleNone : UITableViewCellSelectionStyleDefault;
  }
  cell.userInteractionEnabled = !row.disabled || [row.kind isEqualToString:@"switch"];
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
  RNUXSettingsRow *row = [self rowAtIndexPath:indexPath];
  if (row.disabled || ![row.kind isEqualToString:@"action"]) {
    return;
  }
  [self emitType:"press" rowId:row.rowId value:NO];
}

- (void)didToggle:(UISwitch *)toggle
{
  CGPoint point = [toggle convertPoint:CGPointMake(CGRectGetMidX(toggle.bounds), CGRectGetMidY(toggle.bounds)) toView:_tableView];
  NSIndexPath *indexPath = [_tableView indexPathForRowAtPoint:point];
  if (indexPath == nil) {
    return;
  }
  RNUXSettingsRow *row = [self rowAtIndexPath:indexPath];
  [self emitType:"valueChange" rowId:row.rowId value:toggle.on];
}

- (void)emitType:(const char *)type rowId:(NSString *)rowId value:(BOOL)value
{
  auto emitter = std::static_pointer_cast<NativeUIXSettingsEventEmitter const>(_eventEmitter);
  if (emitter) {
    emitter->onAction({std::string(type), std::string(rowId.UTF8String), (bool)value});
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _sections = @[];
  [_tableView reloadData];
  [_tableView setContentOffset:CGPointZero animated:NO];
}
@end
