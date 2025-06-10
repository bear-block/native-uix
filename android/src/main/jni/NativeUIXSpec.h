#pragma once

// Replaces the Codegen header of the same name so autolinking registers the
// custom shadow nodes (measured from native state) next to generated ones.
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>
#include <react/renderer/components/NativeUIXSpec/ComponentDescriptors.h>
#include <react/renderer/components/NativeUIXSpec/NativeUIXShadowNodes.h>

namespace facebook::react {

JSI_EXPORT
std::shared_ptr<TurboModule> NativeUIXSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace facebook::react
