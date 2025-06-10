package dev.nativeuix

import android.content.res.ColorStateList
import android.graphics.Color
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXButtonManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXButtonManagerInterface
import com.google.android.material.button.MaterialButton
import com.google.android.material.color.MaterialColors

class NativeUIXButtonView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  // One button for the view's lifetime: replacing it would cut the ripple of
  // the press that caused the update (for example a tab that becomes primary).
  private val button = MaterialButton(materialContext(context)).apply {
    isAllCaps = false
    setOnClickListener {
      this@NativeUIXButtonView.dispatchNativeEvent(
        "topButtonPress",
        Arguments.createMap().apply { putDouble("timestamp", System.currentTimeMillis().toDouble()) },
      )
    }
  }
  private var primary: Boolean? = null
  private var destructive: Boolean? = null

  init {
    addView(button, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    setStyle(primary = false, destructive = false)
  }

  /** Restyles in place as Material 3 filled (primary) or outlined (secondary). */
  fun setStyle(primary: Boolean = this.primary ?: false, destructive: Boolean = this.destructive ?: false) {
    if (primary == this.primary && destructive == this.destructive) return
    this.primary = primary
    this.destructive = destructive
    val accent = color(if (destructive) androidx.appcompat.R.attr.colorError else androidx.appcompat.R.attr.colorPrimary)
    val onAccent = color(
      if (destructive) com.google.android.material.R.attr.colorOnError else com.google.android.material.R.attr.colorOnPrimary,
    )
    val onSurface = color(com.google.android.material.R.attr.colorOnSurface)
    val disabledContainer = MaterialColors.compositeARGBWithAlpha(onSurface, 31) // 12%
    val disabledContent = MaterialColors.compositeARGBWithAlpha(onSurface, 97) // 38%
    if (primary) {
      button.backgroundTintList = states(enabled = accent, disabled = disabledContainer)
      button.setTextColor(states(enabled = onAccent, disabled = disabledContent))
      button.rippleColor = ColorStateList.valueOf(MaterialColors.compositeARGBWithAlpha(onAccent, 26))
      button.strokeWidth = 0
    } else {
      button.backgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)
      button.setTextColor(states(enabled = accent, disabled = disabledContent))
      button.rippleColor = ColorStateList.valueOf(MaterialColors.compositeARGBWithAlpha(accent, 26))
      button.strokeWidth = (resources.displayMetrics.density).toInt().coerceAtLeast(1)
      val outline = if (destructive) accent else color(com.google.android.material.R.attr.colorOutline)
      button.strokeColor = states(enabled = outline, disabled = disabledContainer)
    }
  }

  fun setLabel(value: String) {
    if (button.text.toString() == value) return
    button.text = value
    requestLayout()
  }

  fun setDisabled(value: Boolean) {
    button.isEnabled = !value
  }

  fun setA11yLabel(value: String?) {
    button.contentDescription = value?.takeIf { it.isNotEmpty() }
  }

  private fun color(attr: Int): Int = MaterialColors.getColor(button, attr)

  private fun states(enabled: Int, disabled: Int) = ColorStateList(
    arrayOf(intArrayOf(-android.R.attr.state_enabled), intArrayOf()),
    intArrayOf(disabled, enabled),
  )

  override fun measureContent(): Pair<Int, Int> = measureChild(button, hugWidth = true)
}

class NativeUIXButtonManager :
  SimpleViewManager<NativeUIXButtonView>(),
  NativeUIXButtonManagerInterface<NativeUIXButtonView> {
  private val delegate = NativeUIXButtonManagerDelegate(this)

  override fun getName(): String = NAME

  override fun getDelegate(): ViewManagerDelegate<NativeUIXButtonView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXButtonView(reactContext)

  override fun setLabel(view: NativeUIXButtonView, value: String?) = view.setLabel(value.orEmpty())

  override fun setVariant(view: NativeUIXButtonView, value: String?) = view.setStyle(primary = value == "primary")

  override fun setDestructive(view: NativeUIXButtonView, value: Boolean) = view.setStyle(destructive = value)

  override fun setDisabled(view: NativeUIXButtonView, value: Boolean) = view.setDisabled(value)

  override fun setAccessibilityLabel(view: NativeUIXButtonView, value: String?) = view.setA11yLabel(value)

  override fun updateState(view: NativeUIXButtonView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    return null
  }


  private companion object {
    const val NAME = "NativeUIXButton"
  }
}
