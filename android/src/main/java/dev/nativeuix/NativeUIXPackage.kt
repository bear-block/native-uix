package dev.nativeuix

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class NativeUIXPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = emptyList()

  override fun createViewManagers(
    reactContext: ReactApplicationContext,
  ): List<ViewManager<*, *>> = listOf(
    NativeUIXButtonManager(),
    NativeUIXSwitchManager(),
    NativeUIXSegmentedControlManager(),
    NativeUIXSettingsManager(),
  )
}
