#pragma once

#include <react/renderer/graphics/Size.h>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * Content size measured by the mounted native control on the UI thread and
 * written back into the shadow tree. Yoga re-lays out from it without a React
 * render.
 */
class NativeUIXSizeState final {
 public:
  NativeUIXSizeState() = default;
  explicit NativeUIXSizeState(Size size) : size(size) {}

#ifdef RN_SERIALIZABLE_STATE
  NativeUIXSizeState(const NativeUIXSizeState & /*previous*/, folly::dynamic data)
      : size{
            static_cast<Float>(data["width"].getDouble()),
            static_cast<Float>(data["height"].getDouble())} {}

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
};

} // namespace facebook::react
