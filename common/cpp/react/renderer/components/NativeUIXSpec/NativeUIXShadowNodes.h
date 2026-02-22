#pragma once

#include <cmath>

#include <jsi/jsi.h>
#include <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#include <react/renderer/components/NativeUIXSpec/NativeUIXSizeState.h>
#include <react/renderer/components/NativeUIXSpec/NativeUIXStackScreenState.h>
#include <react/renderer/components/NativeUIXSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>

namespace facebook::react {

JSI_EXPORT extern const char NativeUIXButtonComponentName[];
JSI_EXPORT extern const char NativeUIXSwitchComponentName[];
JSI_EXPORT extern const char NativeUIXSegmentedControlComponentName[];
JSI_EXPORT extern const char NativeUIXStackScreenComponentName[];

// Hug: natural width, capped by the parent. Fill: take the available width.
enum class NativeUIXWidthMode { Hug, Fill };

/*
 * Leaf node measured from NativeUIXSizeState. The native view reports its real
 * size (width = natural width, height = height at the current width); until it
 * does, the node uses a platform-typical control height.
 */
template <
    const char *concreteComponentName,
    typename PropsT,
    typename EventEmitterT,
    NativeUIXWidthMode widthMode>
class NativeUIXMeasuredShadowNode final : public ConcreteViewShadowNode<
                                              concreteComponentName,
                                              PropsT,
                                              EventEmitterT,
                                              NativeUIXSizeState> {
  using Base =
      ConcreteViewShadowNode<concreteComponentName, PropsT, EventEmitterT, NativeUIXSizeState>;

 public:
  using Base::Base;

  static ShadowNodeTraits BaseTraits()
  {
    auto traits = Base::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  static NativeUIXSizeState initialStateData(
      const Props::Shared & /*props*/,
      const ShadowNodeFamily::Shared & /*family*/,
      const ComponentDescriptor & /*componentDescriptor*/)
  {
    return NativeUIXSizeState{Size{0, kInitialHeight}};
  }

  Size measureContent(const LayoutContext & /*layoutContext*/, const LayoutConstraints &constraints)
      const override
  {
    Size size = this->getStateData().size;
    if (widthMode == NativeUIXWidthMode::Fill && std::isfinite(constraints.maximumSize.width)) {
      size.width = constraints.maximumSize.width;
    }
    return constraints.clamp(size);
  }

 private:
#ifdef __APPLE__
  static constexpr Float kInitialHeight = 44;
#else
  static constexpr Float kInitialHeight = 48;
#endif
};

using NativeUIXButtonShadowNode = NativeUIXMeasuredShadowNode<
    NativeUIXButtonComponentName,
    NativeUIXButtonProps,
    NativeUIXButtonEventEmitter,
    NativeUIXWidthMode::Hug>;
using NativeUIXSwitchShadowNode = NativeUIXMeasuredShadowNode<
    NativeUIXSwitchComponentName,
    NativeUIXSwitchProps,
    NativeUIXSwitchEventEmitter,
    NativeUIXWidthMode::Fill>;
using NativeUIXSegmentedControlShadowNode = NativeUIXMeasuredShadowNode<
    NativeUIXSegmentedControlComponentName,
    NativeUIXSegmentedControlProps,
    NativeUIXSegmentedControlEventEmitter,
    NativeUIXWidthMode::Fill>;

using NativeUIXButtonComponentDescriptor = ConcreteComponentDescriptor<NativeUIXButtonShadowNode>;
using NativeUIXSwitchComponentDescriptor = ConcreteComponentDescriptor<NativeUIXSwitchShadowNode>;
using NativeUIXSegmentedControlComponentDescriptor =
    ConcreteComponentDescriptor<NativeUIXSegmentedControlShadowNode>;

/*
 * A navigation stack screen. Where the platform places screens below a native
 * app bar (Android), the stack writes the content area's size into the state
 * and the screen is laid out at that size; until then, and on iOS, where
 * screens extend under the translucent bar, it fills the stack. On iOS the
 * state's top inset pads content that is not in a scroll view below the bar,
 * as UIKit's safe area does.
 */
using NativeUIXStackScreenShadowNode = ConcreteViewShadowNode<
    NativeUIXStackScreenComponentName,
    NativeUIXStackScreenProps,
    NativeUIXStackScreenEventEmitter,
    NativeUIXStackScreenState>;

class NativeUIXStackScreenComponentDescriptor final
    : public ConcreteComponentDescriptor<NativeUIXStackScreenShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override
  {
    auto &screen = static_cast<NativeUIXStackScreenShadowNode &>(shadowNode);
    const auto &state = screen.getStateData();
    auto &layoutable = static_cast<YogaLayoutableShadowNode &>(screen);
    if (state.size.width > 0 && state.size.height > 0) {
      layoutable.setSize(state.size);
      layoutable.setPositionType(YGPositionTypeAbsolute);
    }
    if (state.topInset > 0) {
      layoutable.setPadding(RectangleEdges<Float>{0, state.topInset, 0, 0});
    }
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
