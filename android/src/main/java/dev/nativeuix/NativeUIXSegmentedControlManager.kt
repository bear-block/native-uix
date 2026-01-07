package dev.nativeuix

import android.view.View
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSegmentedControlManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSegmentedControlManagerInterface
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup

/** Material 3 segmented buttons: a single-selection toggle group. */
class NativeUIXSegmentedControlView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private var themed = materialContext(context)
  private var group = createGroup()
  private var labels: List<String> = emptyList()
  private var buttonIds: List<Int> = emptyList()
  private var applying = false
  private var selectedIndex = -1
  private var committedIndex = -1
  private var disabled = false

  init {
    addView(group, FrameLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
  }

  private fun createGroup() = MaterialButtonToggleGroup(themed).apply {
    isSingleSelection = true
    isSelectionRequired = true
    addOnButtonCheckedListener { _, checkedId, isChecked ->
      if (applying || !isChecked) return@addOnButtonCheckedListener
      val index = buttonIds.indexOf(checkedId)
      if (index < 0 || index == selectedIndex) return@addOnButtonCheckedListener
      selectedIndex = index
      this@NativeUIXSegmentedControlView.dispatchNativeEvent(
        "topSelectionRequest",
        Arguments.createMap().apply { putInt("index", index) },
      )
    }
  }

  override fun onNightModeChanged() {
    val description = group.contentDescription
    removeView(group)
    themed = materialContext(context)
    group = createGroup().apply { contentDescription = description }
    addView(group, FrameLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    val current = labels
    labels = emptyList()
    buttonIds = emptyList()
    rebuildButtons(current)
  }

  fun setLabels(array: ReadableArray?) {
    val next = (0 until (array?.size() ?: 0)).map { array?.getString(it).orEmpty() }
    if (next == labels) return
    applying = true
    if (next.size == labels.size) {
      // Same segments, new titles: update in place.
      next.forEachIndexed { index, label -> group.findViewById<MaterialButton>(buttonIds[index]).text = label }
    } else {
      rebuildButtons(next)
    }
    labels = next
    applying = false
    applySelection()
    requestLayout()
  }

  private fun rebuildButtons(next: List<String>) {
    applying = true
    group.removeAllViews()
    buttonIds = next.map { label ->
      val button = MaterialButton(themed, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
        id = View.generateViewId()
        text = label
        isAllCaps = false
        isCheckable = true
        isEnabled = !disabled
      }
      group.addView(button, LinearLayout.LayoutParams(0, WRAP_CONTENT, 1f))
      button.id
    }
    selectedIndex = -1
    labels = next
    applying = false
    applySelection()
  }

  /** Applies a committed selection without reporting it as a user request. */
  fun setSelectedIndex(index: Int) {
    committedIndex = index
    applySelection()
  }

  // Props may arrive before labels, so the committed index is kept and
  // re-applied after the buttons exist.
  private fun applySelection() {
    val id = buttonIds.getOrNull(committedIndex) ?: View.NO_ID
    selectedIndex = if (id == View.NO_ID) -1 else committedIndex
    if (group.checkedButtonId == id) return
    applying = true
    if (id == View.NO_ID) group.clearChecked() else group.check(id)
    applying = false
  }

  fun setDisabled(value: Boolean) {
    disabled = value
    group.isEnabled = !value
    for (i in 0 until group.childCount) group.getChildAt(i).isEnabled = !value
  }

  fun setA11yLabel(value: String?) {
    group.contentDescription = value?.takeIf { it.isNotEmpty() }
  }

  override fun measureContent(): Pair<Int, Int> = measureChild(group, hugWidth = false)
}

class NativeUIXSegmentedControlManager :
  SimpleViewManager<NativeUIXSegmentedControlView>(),
  NativeUIXSegmentedControlManagerInterface<NativeUIXSegmentedControlView> {
  private val delegate = NativeUIXSegmentedControlManagerDelegate(this)

  override fun getName(): String = "NativeUIXSegmentedControl"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXSegmentedControlView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXSegmentedControlView(reactContext)

  override fun setLabels(view: NativeUIXSegmentedControlView, value: ReadableArray?) = view.setLabels(value)

  override fun setSelectedIndex(view: NativeUIXSegmentedControlView, value: Int) = view.setSelectedIndex(value)

  override fun setDisabled(view: NativeUIXSegmentedControlView, value: Boolean) = view.setDisabled(value)

  override fun setAccessibilityLabel(view: NativeUIXSegmentedControlView, value: String?) = view.setA11yLabel(value)

  override fun setNativeSelectedIndex(view: NativeUIXSegmentedControlView, index: Int) = view.setSelectedIndex(index)

  override fun updateState(view: NativeUIXSegmentedControlView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

}
