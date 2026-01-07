package dev.nativeuix

import android.content.Context
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import android.view.ViewGroup
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSettingsManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXSettingsManagerInterface
import com.google.android.material.color.MaterialColors
import com.google.android.material.materialswitch.MaterialSwitch
import androidx.core.view.ViewCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

private data class SettingsItem(
  val kind: String,
  val id: String,
  val label: String,
  val value: Boolean,
  val disabled: Boolean,
) {
  val key get() = "$kind:$id"
}

private const val TYPE_TITLE = 0
private const val TYPE_HEADER = 1
private const val TYPE_ACTION = 2
private const val TYPE_SWITCH = 3

/** Native Material 3 settings list. Rows are recycled; only visible rows exist. */
class NativeUIXSettingsView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private var themed: Context = materialContext(context)
  private var title = ""
  private var items: List<SettingsItem> = emptyList()
  private var lastItems: ReadableArray? = null
  private var binding = false
  private val adapter = SettingsAdapter()
  private val list = RecyclerView(themed).apply {
    layoutManager = LinearLayoutManager(themed)
    adapter = this@NativeUIXSettingsView.adapter
    itemAnimator = null
    setBackgroundColor(MaterialColors.getColor(this, com.google.android.material.R.attr.colorSurface))
  }

  init {
    addView(list, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
  }

  override fun onNightModeChanged() {
    themed = materialContext(context)
    list.setBackgroundColor(MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurface, 0))
    // Re-attaching the adapter recreates every row with the new theme; the
    // layout manager state keeps the user's scroll position.
    val scrollState = list.layoutManager?.onSaveInstanceState()
    list.recycledViewPool.clear()
    list.adapter = null
    list.adapter = adapter
    scrollState?.let { list.layoutManager?.onRestoreInstanceState(it) }
  }

  fun setScreenTitle(value: String?) {
    val next = value.orEmpty()
    if (next == title) return
    val hadTitle = title.isNotEmpty()
    title = next
    when {
      hadTitle && next.isNotEmpty() -> adapter.notifyItemChanged(0)
      else -> adapter.notifyDataSetChanged()
    }
  }

  /** Re-applies the committed items, restoring a rejected switch. */
  fun reapply() = setItems(lastItems)

  fun setItems(array: ReadableArray?) {
    lastItems = array
    val next = (0 until (array?.size() ?: 0)).mapNotNull { index ->
      val map = array?.getMap(index) ?: return@mapNotNull null
      SettingsItem(
        kind = map.getString("kind").orEmpty(),
        id = map.getString("id").orEmpty(),
        label = map.getString("label").orEmpty(),
        value = map.hasKey("value") && map.getBoolean("value"),
        disabled = map.hasKey("disabled") && map.getBoolean("disabled"),
      )
    }
    val sameRows = next.map { it.key } == items.map { it.key }
    items = next
    if (sameRows) {
      // Same rows in the same order: rebind visible rows in place. A notify
      // would rebind through the recycler and end a running switch animation.
      var first = Int.MAX_VALUE
      var last = -1
      for (i in 0 until list.childCount) {
        val holder = list.getChildViewHolder(list.getChildAt(i))
        val position = holder.bindingAdapterPosition
        if (position == RecyclerView.NO_POSITION) continue
        adapter.bind(holder, position)
        first = minOf(first, position)
        last = maxOf(last, position)
      }
      // Rows outside the attached range may sit bound in the recycler's cache;
      // mark them changed so they rebind before they come back on screen.
      val count = adapter.itemCount
      if (last < 0) {
        adapter.notifyItemRangeChanged(0, count)
      } else {
        if (first > 0) adapter.notifyItemRangeChanged(0, first)
        if (last + 1 < count) adapter.notifyItemRangeChanged(last + 1, count - last - 1)
      }
    } else {
      adapter.notifyDataSetChanged()
    }
  }

  private fun itemAt(position: Int): SettingsItem? =
    items.getOrNull(if (title.isEmpty()) position else position - 1)

  private inner class SettingsAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    override fun getItemCount() = items.size + if (title.isEmpty()) 0 else 1

    override fun getItemViewType(position: Int): Int = when (itemAt(position)?.kind) {
      null -> TYPE_TITLE
      "header" -> TYPE_HEADER
      "switch" -> TYPE_SWITCH
      else -> TYPE_ACTION
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
      val view = when (viewType) {
        TYPE_TITLE -> TextView(themed).apply {
          setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_HeadlineLarge)
          setTextColor(MaterialColors.getColor(this, com.google.android.material.R.attr.colorOnSurface))
          setPadding(dp(16), dp(16), dp(16), dp(8))
          ViewCompat.setAccessibilityHeading(this, true)
        }
        TYPE_HEADER -> TextView(themed).apply {
          setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_TitleSmall)
          setTextColor(MaterialColors.getColor(this, androidx.appcompat.R.attr.colorPrimary))
          setPadding(dp(16), dp(24), dp(16), dp(8))
          ViewCompat.setAccessibilityHeading(this, true)
        }
        TYPE_SWITCH -> MaterialSwitch(themed).apply {
          setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyLarge)
          minHeight = dp(56)
          setPadding(dp(16), 0, dp(16), 0)
          setOnCheckedChangeListener { _, checked ->
            if (!binding) emit("valueChange", tag as String, checked)
          }
        }
        else -> TextView(themed).apply {
          setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyLarge)
          setTextColor(MaterialColors.getColor(this, com.google.android.material.R.attr.colorOnSurface))
          minHeight = dp(56)
          gravity = Gravity.CENTER_VERTICAL
          setPadding(dp(16), 0, dp(16), 0)
          isClickable = true
          isFocusable = true
          val ripple = TypedValue()
          themed.theme.resolveAttribute(android.R.attr.selectableItemBackground, ripple, true)
          setBackgroundResource(ripple.resourceId)
          setOnClickListener { emit("press", tag as String, false) }
        }
      }
      view.layoutParams = RecyclerView.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
      return object : RecyclerView.ViewHolder(view) {}
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) = bind(holder, position)

    fun bind(holder: RecyclerView.ViewHolder, position: Int) {
      val view = holder.itemView
      val item = itemAt(position)
      binding = true
      if (item == null) {
        (view as TextView).text = title
      } else {
        view.tag = item.id
        when (view) {
          is MaterialSwitch -> {
            if (view.text != item.label) view.text = item.label
            if (view.isChecked != item.value) view.isChecked = item.value
            if (view.isEnabled == item.disabled) view.isEnabled = !item.disabled
          }
          is TextView -> {
            if (view.text.toString() != item.label) view.text = item.label
            view.isEnabled = !item.disabled
            if (item.kind != "header") view.alpha = if (item.disabled) 0.38f else 1f
          }
        }
      }
      binding = false
    }
  }

  private fun emit(type: String, rowId: String, value: Boolean) {
    dispatchNativeEvent(
      "topAction",
      Arguments.createMap().apply {
        putString("type", type)
        putString("rowId", rowId)
        putBoolean("value", value)
      },
    )
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}

class NativeUIXSettingsManager :
  SimpleViewManager<NativeUIXSettingsView>(),
  NativeUIXSettingsManagerInterface<NativeUIXSettingsView> {
  private val delegate = NativeUIXSettingsManagerDelegate(this)

  override fun getName(): String = "NativeUIXSettings"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXSettingsView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXSettingsView(reactContext)

  override fun setScreenTitle(view: NativeUIXSettingsView, value: String?) = view.setScreenTitle(value)

  override fun setItems(view: NativeUIXSettingsView, value: ReadableArray?) = view.setItems(value)

  // A new revision follows every native request (see SettingsScreen.tsx).
  override fun setRevision(view: NativeUIXSettingsView, value: Int) = view.reapply()

}
