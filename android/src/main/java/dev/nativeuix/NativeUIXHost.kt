package dev.nativeuix

import android.content.Context
import android.view.ContextThemeWrapper
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.google.android.material.color.DynamicColors
import kotlin.math.abs

/** Material 3 theme owned by the library, so apps need no theme changes. */
// Cached per React context: building a dynamic-color theme per view is costly.
// Values are weak too, because each wrapper references its key; views keep the
// wrapper alive while they exist.
private val materialContexts = java.util.WeakHashMap<Context, java.lang.ref.WeakReference<Context>>()

internal fun materialContext(context: Context): Context =
  materialContexts[context]?.get()
    ?: DynamicColors.wrapContextIfAvailable(
      ContextThemeWrapper(context, com.google.android.material.R.style.Theme_Material3_DayNight_NoActionBar),
    ).also { materialContexts[context] = java.lang.ref.WeakReference(it) }

internal class NativeUIXEvent(
  surfaceId: Int,
  viewId: Int,
  private val name: String,
  private val data: WritableMap,
) : Event<NativeUIXEvent>(surfaceId, viewId) {
  override fun getEventName(): String = name

  // Presses and value requests are discrete; merging two would drop one.
  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap = data
}

internal fun View.dispatchNativeEvent(name: String, data: WritableMap) {
  val reactContext = context as? ReactContext ?: return
  val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
  UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    ?.dispatchEvent(NativeUIXEvent(surfaceId, id, name, data))
}

/**
 * Host for natively laid out content inside a Fabric view. Fabric sets this
 * view's frame; children changing on their own need a manual measure/layout
 * pass, because React Native does not run Android's layout for them.
 */
open class NativeUIXHostLayout(context: Context) : FrameLayout(context) {
  // Nullable: requestLayout() runs from the superclass constructor first.
  @Suppress("RedundantNullableReturnType")
  private val measureAndLayout: Runnable? = Runnable {
    layoutPending = false
    withoutRelayout {
      measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
      )
      layout(left, top, right, bottom)
    }
  }
  private var layoutPending = false
  private var measuring = false

  override fun requestLayout() {
    super.requestLayout()
    // Some widgets (MaterialButtonToggleGroup) request layout while being
    // measured; reacting to those would re-layout on every frame.
    val pass = measureAndLayout ?: return
    if (layoutPending || measuring) return
    layoutPending = true
    post(pass)
  }

  private inline fun withoutRelayout(block: () -> Unit) {
    measuring = true
    try {
      block()
    } finally {
      measuring = false
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    post { reportIntrinsicSize() }
  }

  /** Content size to report, in pixels, or null when this host has none. */
  protected open fun measureContent(): Pair<Int, Int>? = null

  /** Fabric state of the custom shadow node (common/cpp); null for hosts without one. */
  var stateWrapper: StateWrapper? = null
    set(value) {
      val first = field == null
      field = value
      if (first) post { reportIntrinsicSize() }
    }

  // Writes the measured size into the shadow node; Yoga re-lays out from it in
  // native code, without a React render.
  private fun reportIntrinsicSize() {
    val state = stateWrapper ?: return
    var content: Pair<Int, Int>? = null
    withoutRelayout { content = measureContent() }
    val (widthPx, heightPx) = content ?: return
    val density = resources.displayMetrics.density
    val width = widthPx / density
    val height = heightPx / density
    // Compare with the committed state, so a state update never triggers another.
    val current = state.stateData
    if (current != null && current.hasKey("width") && current.hasKey("height") &&
      abs(current.getDouble("width") - width) < 0.5 && abs(current.getDouble("height") - height) < 0.5
    ) {
      return
    }
    state.updateState(
      WritableNativeMap().apply {
        putDouble("width", width.toDouble())
        putDouble("height", height.toDouble())
      },
    )
  }

  /** Natural width, and the height needed at the current width. */
  protected fun measureChild(child: View, hugWidth: Boolean): Pair<Int, Int> {
    val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    child.measure(unspecified, unspecified)
    val naturalWidth = child.measuredWidth
    var height = child.measuredHeight
    if (width > 0) {
      child.measure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY), unspecified)
      height = child.measuredHeight
      // Restore the measurement used by the current layout.
      child.measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(this.height, MeasureSpec.EXACTLY),
      )
    }
    return (if (hugWidth) naturalWidth else width) to height
  }
}
