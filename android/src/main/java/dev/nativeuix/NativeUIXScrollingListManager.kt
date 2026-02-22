package dev.nativeuix

import android.content.Context
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXScrollingListManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXScrollingListManagerInterface
import com.google.android.material.color.MaterialColors

private data class ListRow(
  val id: String,
  val title: String,
  val subtitle: String,
  val section: String,
  val action: Boolean,
  val disabled: Boolean,
)

/** A section header (row == null) or a row, in display order. */
private data class ListEntry(val header: String?, val row: ListRow?)

private const val TYPE_SECTION = 0
private const val TYPE_ROW = 1

/** Native Material 3 sectioned list. Rows are recycled; nested scrolling drives the app bar. */
class NativeUIXScrollingListView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private var themed: Context = materialContext(context)
  private var entries: List<ListEntry> = emptyList()
  private val adapter = ListAdapter()
  private val list = RecyclerView(themed).apply {
    layoutManager = LinearLayoutManager(themed)
    adapter = this@NativeUIXScrollingListView.adapter
    setBackgroundColor(MaterialColors.getColor(this, com.google.android.material.R.attr.colorSurface))
  }

  init {
    addView(list, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
  }

  override fun onNightModeChanged() {
    themed = materialContext(context)
    list.setBackgroundColor(MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurface, 0))
    val scrollState = list.layoutManager?.onSaveInstanceState()
    list.recycledViewPool.clear()
    list.adapter = null
    list.adapter = adapter
    scrollState?.let { list.layoutManager?.onRestoreInstanceState(it) }
  }

  fun setItems(array: ReadableArray?) {
    val rows = (0 until (array?.size() ?: 0)).mapNotNull { index ->
      val map = array?.getMap(index) ?: return@mapNotNull null
      ListRow(
        id = map.getString("id").orEmpty(),
        title = map.getString("title").orEmpty(),
        subtitle = map.getString("subtitle").orEmpty(),
        section = map.getString("section").orEmpty(),
        action = map.hasKey("action") && map.getBoolean("action"),
        disabled = map.hasKey("disabled") && map.getBoolean("disabled"),
      )
    }
    val grouped = LinkedHashMap<String, MutableList<ListRow>>()
    rows.forEach { grouped.getOrPut(it.section) { mutableListOf() }.add(it) }
    val next = mutableListOf<ListEntry>()
    grouped.forEach { (section, sectionRows) ->
      if (section.isNotEmpty()) next.add(ListEntry(section, null))
      sectionRows.forEach { next.add(ListEntry(null, it)) }
    }
    if (next == entries) return
    entries = next
    adapter.notifyDataSetChanged()
  }

  private inner class ListAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    override fun getItemCount() = entries.size

    override fun getItemViewType(position: Int) = if (entries[position].row == null) TYPE_SECTION else TYPE_ROW

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
      val view = if (viewType == TYPE_SECTION) {
        TextView(themed).apply {
          setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_TitleSmall)
          setTextColor(MaterialColors.getColor(this, androidx.appcompat.R.attr.colorPrimary))
          setPadding(dp(16), dp(24), dp(16), dp(8))
          ViewCompat.setAccessibilityHeading(this, true)
        }
      } else {
        LinearLayout(themed).apply {
          orientation = LinearLayout.VERTICAL
          gravity = Gravity.CENTER_VERTICAL
          minimumHeight = dp(72)
          setPadding(dp(16), dp(8), dp(24), dp(8))
          addView(TextView(themed).apply {
            setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyLarge)
            setTextColor(MaterialColors.getColor(this, com.google.android.material.R.attr.colorOnSurface))
          })
          addView(TextView(themed).apply {
            setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyMedium)
            setTextColor(MaterialColors.getColor(this, com.google.android.material.R.attr.colorOnSurfaceVariant))
          })
          setOnClickListener { emitPress(tag as String) }
        }
      }
      view.layoutParams = RecyclerView.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
      return object : RecyclerView.ViewHolder(view) {}
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
      val entry = entries[position]
      val row = entry.row
      if (row == null) {
        (holder.itemView as TextView).text = entry.header
        return
      }
      val view = holder.itemView as LinearLayout
      view.tag = row.id
      (view.getChildAt(0) as TextView).text = row.title
      (view.getChildAt(1) as TextView).apply {
        text = row.subtitle
        visibility = if (row.subtitle.isEmpty()) android.view.View.GONE else android.view.View.VISIBLE
      }
      val pressable = row.action && !row.disabled
      view.isClickable = pressable
      view.isFocusable = pressable
      if (pressable) {
        val ripple = TypedValue()
        themed.theme.resolveAttribute(android.R.attr.selectableItemBackground, ripple, true)
        view.setBackgroundResource(ripple.resourceId)
      } else {
        view.background = null
      }
      view.isEnabled = !row.disabled
      view.alpha = if (row.disabled) 0.38f else 1f
    }
  }

  private fun emitPress(id: String) {
    dispatchNativeEvent("topItemPress", Arguments.createMap().apply { putString("id", id) })
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}

class NativeUIXScrollingListManager :
  SimpleViewManager<NativeUIXScrollingListView>(),
  NativeUIXScrollingListManagerInterface<NativeUIXScrollingListView> {
  private val delegate = NativeUIXScrollingListManagerDelegate(this)

  override fun getName(): String = "NativeUIXScrollingList"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXScrollingListView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXScrollingListView(reactContext)

  override fun setItems(view: NativeUIXScrollingListView, value: ReadableArray?) = view.setItems(value)
}
