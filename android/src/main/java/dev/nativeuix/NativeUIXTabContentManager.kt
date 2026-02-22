package dev.nativeuix

import android.view.View
import androidx.transition.Transition
import androidx.transition.TransitionManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabContentManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabContentManagerInterface
import com.facebook.react.viewmanagers.NativeUIXTabPageManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabPageManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.transition.MaterialFadeThrough
import com.google.android.material.transition.MaterialSharedAxis

/**
 * A page of NativeUIXTabContentView. Fabric sets every view VISIBLE on each
 * layout update, so an inactive page overrides that and stays invisible.
 */
class NativeUIXTabPageView(context: ThemedReactContext) : ReactViewGroup(context) {
  private var requestedVisibility = View.VISIBLE

  /** Matched against the container's selected ID; Fabric may reorder pages (zIndex). */
  var pageId = ""

  var inactive = false
    set(value) {
      field = value
      super.setVisibility(if (value) View.INVISIBLE else requestedVisibility)
    }

  override fun setVisibility(visibility: Int) {
    requestedVisibility = visibility
    super.setVisibility(if (inactive) View.INVISIBLE else visibility)
  }
}

/**
 * Keeps every page mounted and shows the selected one, as bottom navigation
 * keeps its destinations. `platform` and `fadeThrough` use Material's fade
 * through; `sharedAxisX` uses the shared axis transition, on the real views.
 */
class NativeUIXTabContentView(context: ThemedReactContext) : ReactViewGroup(context) {
  var motion = "platform"
  private var selectedId: String? = null

  init {
    clipChildren = true
  }

  fun select(id: String?) {
    if (id == selectedId) return
    selectedId = id
    if (motion != "none" && isAttachedToWindow && isLaidOut) {
      // Typed explicitly: the inferred common supertype, MaterialVisibility,
      // is not public and fails at run time with IllegalAccessError.
      val transition: Transition = if (motion == "sharedAxisX") {
        MaterialSharedAxis(MaterialSharedAxis.X, true)
      } else {
        MaterialFadeThrough()
      }
      TransitionManager.beginDelayedTransition(this, transition)
    }
    applySelection()
  }

  fun applySelection() {
    for (i in 0 until childCount) {
      val page = getChildAt(i) as? NativeUIXTabPageView ?: continue
      page.inactive = page.pageId != selectedId
    }
  }
}

class NativeUIXTabContentManager :
  ViewGroupManager<NativeUIXTabContentView>(),
  NativeUIXTabContentManagerInterface<NativeUIXTabContentView> {
  private val delegate = NativeUIXTabContentManagerDelegate(this)

  override fun getName(): String = "NativeUIXTabContent"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXTabContentView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXTabContentView(reactContext)

  override fun setSelectedId(view: NativeUIXTabContentView, value: String?) = view.select(value)

  override fun setMotion(view: NativeUIXTabContentView, value: String?) {
    view.motion = value ?: "platform"
  }

  override fun addView(parent: NativeUIXTabContentView, child: View, index: Int) {
    super.addView(parent, child, index)
    parent.applySelection()
  }

  override fun removeViewAt(parent: NativeUIXTabContentView, index: Int) {
    (parent.getChildAt(index) as? NativeUIXTabPageView)?.inactive = false
    super.removeViewAt(parent, index)
    parent.applySelection()
  }
}

class NativeUIXTabPageManager :
  ViewGroupManager<NativeUIXTabPageView>(),
  NativeUIXTabPageManagerInterface<NativeUIXTabPageView> {
  private val delegate = NativeUIXTabPageManagerDelegate(this)

  override fun getName(): String = "NativeUIXTabPage"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXTabPageView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXTabPageView(reactContext)

  override fun setPageId(view: NativeUIXTabPageView, value: String?) {
    view.pageId = value.orEmpty()
    (view.parent as? NativeUIXTabContentView)?.applySelection()
  }
}
