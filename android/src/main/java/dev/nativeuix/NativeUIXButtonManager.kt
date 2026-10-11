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
  private var button = createButton()
  private var primary: Boolean? = null
  private var destructive: Boolean? = null
  private var appearance: String? = null
  private var size = "small"

  init {
    addView(button, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    setStyle(primary = false, destructive = false)
    setSize(size)
  }

  private fun createButton() = MaterialButton(materialContext(context)).apply {
    isAllCaps = false
    setOnClickListener {
      this@NativeUIXButtonView.dispatchNativeEvent(
        "topButtonPress",
        Arguments.createMap().apply { putDouble("timestamp", System.currentTimeMillis().toDouble()) },
      )
    }
  }

  override fun onNightModeChanged() {
    val old = button
    button = createButton().apply {
      text = old.text
      isEnabled = old.isEnabled
      contentDescription = old.contentDescription
    }
    removeView(old)
    addView(button, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    val primary = this.primary ?: false
    val destructive = this.destructive ?: false
    val appearance = this.appearance ?: "automatic"
    this.primary = null
    this.destructive = null
    this.appearance = null
    setStyle(primary, destructive, appearance)
    setSize(size)
  }

  /** Apply Material widget state lists without replacing the button or its ripple. */
  fun setStyle(primary: Boolean = this.primary ?: false, destructive: Boolean = this.destructive ?: false,
    appearance: String = this.appearance ?: "automatic") {
    if (primary == this.primary && destructive == this.destructive && appearance == this.appearance) return
    this.primary = primary
    this.destructive = destructive
    this.appearance = appearance
    val resolved = if (appearance == "automatic") (if (primary) "filled" else "outlined") else appearance
    val style = when (resolved) {
      "tonal" -> com.google.android.material.R.style.Widget_Material3_Button_TonalButton
      "outlined" -> com.google.android.material.R.style.Widget_Material3_Button_OutlinedButton
      "text" -> com.google.android.material.R.style.Widget_Material3_Button_TextButton
      "elevated" -> com.google.android.material.R.style.Widget_Material3_Button_ElevatedButton
      else -> com.google.android.material.R.style.Widget_Material3_Button
    }
    val overlayAttrs = button.context.obtainStyledAttributes(style, intArrayOf(com.google.android.material.R.attr.materialThemeOverlay))
    val overlay = try { overlayAttrs.getResourceId(0, 0) } finally { overlayAttrs.recycle() }
    val appearanceContext = if (overlay != 0) android.view.ContextThemeWrapper(button.context, overlay) else button.context
    val attrs = appearanceContext.obtainStyledAttributes(style, intArrayOf(
      com.google.android.material.R.attr.backgroundTint, android.R.attr.textColor,
      com.google.android.material.R.attr.rippleColor, com.google.android.material.R.attr.strokeColor,
      com.google.android.material.R.attr.strokeWidth, android.R.attr.stateListAnimator,
      com.google.android.material.R.attr.elevation, android.R.attr.paddingLeft, android.R.attr.paddingRight,
    ))
    try {
      button.backgroundTintList = attrs.getColorStateList(0)
      attrs.getColorStateList(1)?.let { button.setTextColor(it) }
      button.rippleColor = attrs.getColorStateList(2)
      button.strokeColor = attrs.getColorStateList(3)
      button.strokeWidth = attrs.getDimensionPixelSize(4, 0)
      val animator = attrs.getResourceId(5, 0)
      button.stateListAnimator = if (animator != 0) android.animation.AnimatorInflater.loadStateListAnimator(appearanceContext, animator) else null
      button.elevation = attrs.getDimension(6, 0f)
      button.setPaddingRelative(attrs.getDimensionPixelSize(7, button.paddingStart), button.paddingTop,
        attrs.getDimensionPixelSize(8, button.paddingEnd), button.paddingBottom)
    } finally { attrs.recycle() }
    if (destructive) {
      val accent = color(androidx.appcompat.R.attr.colorError)
      val onAccent = color(com.google.android.material.R.attr.colorOnError)
      val onSurface = color(com.google.android.material.R.attr.colorOnSurface)
      val disabledContent = MaterialColors.compositeARGBWithAlpha(onSurface, 97)
      val solid = resolved == "filled"
      if (solid) button.backgroundTintList = states(accent, MaterialColors.compositeARGBWithAlpha(onSurface, 31))
      button.setTextColor(states(if (solid) onAccent else accent, disabledContent))
      button.rippleColor = ColorStateList.valueOf(MaterialColors.compositeARGBWithAlpha(if (solid) onAccent else accent, 26))
      if (resolved == "outlined") button.strokeColor = states(accent, MaterialColors.compositeARGBWithAlpha(onSurface, 31))
    }
    requestLayout()
  }

  fun setSize(value: String?) {
    size = value ?: "small"
    val density = resources.displayMetrics.density
    val height = when (size) { "medium" -> 64; "large" -> 104; else -> 48 }
    button.insetTop = (4 * density).toInt()
    button.insetBottom = (4 * density).toInt()
    button.minimumHeight = (height * density).toInt()
    requestLayout()
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

  override fun setAppearance(view: NativeUIXButtonView, value: String?) = view.setStyle(appearance = value ?: "automatic")

  override fun setSize(view: NativeUIXButtonView, value: String?) = view.setSize(value)

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
