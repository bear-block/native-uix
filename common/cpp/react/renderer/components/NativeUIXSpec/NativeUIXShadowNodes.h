#pragma once

#include <cmath>

#include <jsi/jsi.h>
#include <react/renderer/components/NativeUIXSpec/EventEmitters.h>
#include <react/renderer/components/NativeUIXSpec/NativeUIXSizeState.h>
#include <react/renderer/components/NativeUIXSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>

namespace facebook::react {

JSI_EXPORT extern const char NativeUIXButtonComponentName[];
JSI_EXPORT extern const char NativeUIXSwitchComponentName[];
JSI_EXPORT extern const char NativeUIXSegmentedControlComponentName[];

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

} // namespace facebook::react
