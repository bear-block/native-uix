#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// One tab of NativeUIXTabs; its view controller is a UITabBarController child.
@interface RNUXTabComponentView : RCTViewComponentView
@property (nonatomic, readonly) UIViewController *controller;
@property (nonatomic, readonly, copy) NSString *tabId;
@property (nonatomic, readonly, copy, nullable) NSString *title;
@property (nonatomic, readonly, nullable) UIImage *image;
@property (nonatomic, readonly, copy, nullable) NSString *badge;
@property (nonatomic, readonly) BOOL searchRole;
/// The UITab built for this tab (iOS 18+), kept in sync with its props.
@property (nonatomic, strong, nullable) id uiTab;
/// The controller `uiTab` was built with; a new controller needs a new tab.
@property (nonatomic, weak, nullable) UIViewController *uiTabController;
@end

NS_ASSUME_NONNULL_END
