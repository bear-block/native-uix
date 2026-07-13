package dev.nativeuix

import android.content.Context
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.LinearLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSheetManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSheetManagerInterface
import com.facebook.react.viewmanagers.NativeUIXSheetContentManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSheetContentManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDragHandleView
import com.google.android.material.color.MaterialColors
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.ShapeAppearanceModel

/** NativeUIXSheetContent: the React content area, sized to the sheet's slot. */
class NativeUIXSheetContentView(context: ThemedReactContext) : ReactViewGroup(context) {
  var stateWrapper: StateWrapper? = null

  internal fun reportSize(widthPx: Int, heightPx: Int) = stateWrapper.reportContainerSize(this, widthPx, heightPx)
}

/** The slot below the drag handle; Fabric positions the content view in it. */
internal class NativeUIXSheetSlot(context: Context) : ViewGroup(context) {
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    for (i in 0 until childCount) (getChildAt(i) as? NativeUIXSheetContentView)?.reportSize(w, h)
  }
}

/**
 * A Material 3 modal bottom sheet over React Native's Modal window:
 * BottomSheetBehavior drags it between half and full height and hides it;
 * a scrim dims the app and closes the sheet when tapped. Closing always
 * animates natively and then reports `onDismiss` once.
 */
class NativeUIXSheetView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private val themed = materialContext(context)
  private var detents = listOf("large")
  private var dismissible = true
  private var open = false
  private var shown = false
  private var dismissReported = false

  private val coordinator = CoordinatorLayout(themed)
  private val scrim = View(themed).apply {
    setBackgroundColor(Color.BLACK)
    alpha = 0f
    setOnClickListener { if (dismissible) behavior.state = BottomSheetBehavior.STATE_HIDDEN }
  }
  private val sheet = LinearLayout(themed).apply { orientation = LinearLayout.VERTICAL }
  private val handle = BottomSheetDragHandleView(themed)
  internal val content = NativeUIXSheetSlot(themed)
  private val behavior = BottomSheetBehavior<LinearLayout>()

  init {
    val radius = 28 * resources.displayMetrics.density
    sheet.background = MaterialShapeDrawable(
      ShapeAppearanceModel.builder().setTopLeftCornerSize(radius).setTopRightCornerSize(radius).build(),
    ).apply {
      fillColor = android.content.res.ColorStateList.valueOf(
        MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurfaceContainerLow, 0),
      )
      elevation = 1 * resources.displayMetrics.density
    }
    sheet.addView(handle, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    sheet.addView(content, LinearLayout.LayoutParams(MATCH_PARENT, 0, 1f))
    behavior.isFitToContents = false
    behavior.halfExpandedRatio = 0.5f
    behavior.skipCollapsed = true
    behavior.isHideable = true
    behavior.state = BottomSheetBehavior.STATE_HIDDEN
    behavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
      override fun onStateChanged(bottomSheet: View, newState: Int) {
        when (newState) {
          BottomSheetBehavior.STATE_HIDDEN -> if (shown) reportDismiss()
          BottomSheetBehavior.STATE_HALF_EXPANDED -> reportDetent("medium")
          BottomSheetBehavior.STATE_EXPANDED -> reportDetent("large")
        }
      }

      // The scrim follows the sheet: clear when hidden, dimmed when open.
      override fun onSlide(bottomSheet: View, slideOffset: Float) {
        scrim.alpha = 0.32f * ((slideOffset + 1f).coerceIn(0f, 1f))
      }
    })
    coordinator.addView(scrim, CoordinatorLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    coordinator.addView(sheet, CoordinatorLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT).apply { behavior = this@NativeUIXSheetView.behavior })
    addView(coordinator, LayoutParams(MATCH_PARENT, MATCH_PARENT))
  }

  // The full-height sheet stops below the status bar.
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val statusBar = ViewCompat.getRootWindowInsets(this)?.getInsets(WindowInsetsCompat.Type.statusBars())?.top ?: 0
    if (behavior.expandedOffset != statusBar) behavior.expandedOffset = statusBar
    super.onLayout(changed, left, top, right, bottom)
    if (open && !shown && isLaidOut) post { show() }
  }

  fun setDetents(value: ReadableArray?) {
    val next = (0 until (value?.size() ?: 0)).mapNotNull { value?.getString(it) }.filter { it == "medium" || it == "large" }
    detents = next.ifEmpty { listOf("large") }
    behavior.skipCollapsed = true
    behavior.isFitToContents = false
  }

  fun setDismissible(value: Boolean) {
    dismissible = value
    // Not dismissible: it cannot be dragged away; closing from React still
    // makes it hideable first.
    behavior.isHideable = value
  }

  fun setGrabber(value: Boolean) {
    handle.visibility = if (value) View.VISIBLE else View.GONE
  }

  fun setOpen(value: Boolean) {
    open = value
    if (value) {
      if (isLaidOut) show()
    } else if (shown) {
      behavior.isHideable = true
      behavior.state = BottomSheetBehavior.STATE_HIDDEN
    }
  }

  private fun show() {
    if (shown) return
    shown = true
    dismissReported = false
    behavior.state = if (detents.first() == "medium") BottomSheetBehavior.STATE_HALF_EXPANDED else BottomSheetBehavior.STATE_EXPANDED
  }

  private fun reportDismiss() {
    if (dismissReported) return
    dismissReported = true
    shown = false
    dispatchNativeEvent("topDismiss", Arguments.createMap())
  }

  private fun reportDetent(detent: String) {
    // A sheet with one detent does not rest anywhere else.
    if (detent !in detents) {
      behavior.state = if (detents.contains("large")) BottomSheetBehavior.STATE_EXPANDED else BottomSheetBehavior.STATE_HALF_EXPANDED
      return
    }
    dispatchNativeEvent("topDetentChange", Arguments.createMap().apply { putString("detent", detent) })
  }
}

class NativeUIXSheetManager :
  ViewGroupManager<NativeUIXSheetView>(),
  NativeUIXSheetManagerInterface<NativeUIXSheetView> {
  private val delegate = NativeUIXSheetManagerDelegate(this)

  override fun getName(): String = "NativeUIXSheet"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXSheetView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXSheetView(reactContext)

  // React's child, NativeUIXSheetContent, goes in the sheet below the handle.
  override fun addView(parent: NativeUIXSheetView, child: View, index: Int) {
    parent.content.addView(child, index)
    (child as? NativeUIXSheetContentView)?.reportSize(parent.content.width, parent.content.height)
  }

  override fun removeViewAt(parent: NativeUIXSheetView, index: Int) = parent.content.removeViewAt(index)

  override fun getChildCount(parent: NativeUIXSheetView): Int = parent.content.childCount

  override fun getChildAt(parent: NativeUIXSheetView, index: Int): View = parent.content.getChildAt(index)

  override fun setOpen(view: NativeUIXSheetView, value: Boolean) = view.setOpen(value)

  override fun setDetents(view: NativeUIXSheetView, value: ReadableArray?) = view.setDetents(value)

  override fun setGrabber(view: NativeUIXSheetView, value: Boolean) = view.setGrabber(value)

  override fun setDismissible(view: NativeUIXSheetView, value: Boolean) = view.setDismissible(value)
}

class NativeUIXSheetContentManager :
  ViewGroupManager<NativeUIXSheetContentView>(),
  NativeUIXSheetContentManagerInterface<NativeUIXSheetContentView> {
  private val delegate = NativeUIXSheetContentManagerDelegate(this)

  override fun getName(): String = "NativeUIXSheetContent"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXSheetContentView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXSheetContentView(reactContext)

  override fun updateState(view: NativeUIXSheetContentView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    (view.parent as? NativeUIXSheetSlot)?.let { view.reportSize(it.width, it.height) }
    return null
  }
}
