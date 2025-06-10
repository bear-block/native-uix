package dev.nativeuix

import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSwitchManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSwitchManagerInterface
import com.google.android.material.materialswitch.MaterialSwitch

class NativeUIXSwitchView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private var applyingValue = false
  private val switch = MaterialSwitch(materialContext(context)).apply {
    setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyLarge)
    setOnCheckedChangeListener { _, checked ->
      if (applyingValue) return@setOnCheckedChangeListener
      this@NativeUIXSwitchView.dispatchNativeEvent(
        "topValueRequest",
        Arguments.createMap().apply { putBoolean("value", checked) },
      )
    }
  }

  init {
    addView(switch, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
  }

  /** Applies a committed value without reporting it as a user request. */
  fun setValue(value: Boolean) {
    if (switch.isChecked == value) return
    applyingValue = true
    switch.isChecked = value
    applyingValue = false
  }

  fun setLabel(value: String) {
    switch.text = value
    requestLayout()
  }

  fun setDisabled(value: Boolean) {
    switch.isEnabled = !value
  }

  fun setA11yLabel(value: String?) {
    switch.contentDescription = value?.takeIf { it.isNotEmpty() }
  }

  override fun measureContent(): Pair<Int, Int> = measureChild(switch, hugWidth = false)
}

class NativeUIXSwitchManager :
  SimpleViewManager<NativeUIXSwitchView>(),
  NativeUIXSwitchManagerInterface<NativeUIXSwitchView> {
  private val delegate = NativeUIXSwitchManagerDelegate(this)

  override fun getName(): String = "NativeUIXSwitch"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXSwitchView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXSwitchView(reactContext)

  override fun setLabel(view: NativeUIXSwitchView, value: String?) = view.setLabel(value.orEmpty())

  override fun setValue(view: NativeUIXSwitchView, value: Boolean) = view.setValue(value)

  override fun setDisabled(view: NativeUIXSwitchView, value: Boolean) = view.setDisabled(value)

  override fun setAccessibilityLabel(view: NativeUIXSwitchView, value: String?) = view.setA11yLabel(value)

  override fun setNativeValue(view: NativeUIXSwitchView, value: Boolean) = view.setValue(value)

  override fun updateState(view: NativeUIXSwitchView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

}
