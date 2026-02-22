#pragma once

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Size.h>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * Written by the native stack. `size` is the content area below a native app
 * bar (Android); zero keeps the screen filling the stack. `topInset` is the
 * area under a translucent navigation bar (iOS) that content outside a scroll
 * view must stay clear of.
 */
class NativeUIXStackScreenState final {
 public:
  NativeUIXStackScreenState() = default;
  NativeUIXStackScreenState(Size size, Float topInset) : size(size), topInset(topInset) {}

#ifdef RN_SERIALIZABLE_STATE
  NativeUIXStackScreenState(const NativeUIXStackScreenState & /*previous*/, folly::dynamic data)
      : size{
            static_cast<Float>(data["width"].getDouble()),
            static_cast<Float>(data["height"].getDouble())},
        topInset{0} {}

  folly::dynamic getDynamic() const
  {
    return folly::dynamic::object("width", size.width)("height", size.height);
  }

  MapBuffer getMapBuffer() const
  {
    return MapBufferBuilder::EMPTY();
  }
#endif

  Size size{};
  Float topInset{0};
};

} // namespace facebook::react
