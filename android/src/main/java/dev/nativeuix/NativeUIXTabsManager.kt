// MaterialExpressiveTheme is experimental in Material 3 1.5 alpha (ADR-0007).
@file:OptIn(androidx.compose.material3.ExperimentalMaterial3ExpressiveApi::class)

package dev.nativeuix

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.icons.Icons
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.res.painterResource
import androidx.transition.Transition
import androidx.transition.TransitionManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabManagerInterface
import com.facebook.react.viewmanagers.NativeUIXTabsManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabsManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.color.MaterialColors
import com.google.android.material.transition.MaterialFadeThrough

/** What the navigation bar shows for one tab. */
internal data class TabItemModel(val id: String, val title: String, val icon: String, val badge: String)

/**
 * One tab of NativeUIXTabs. Fabric sets every view VISIBLE on each layout
 * update, so a tab that is not selected overrides that and stays invisible.
 */
class NativeUIXTabView(context: ThemedReactContext) : ReactViewGroup(context) {
  private var requestedVisibility = View.VISIBLE

  var tabId = ""
  var title = ""
  var icon = ""
  var badge = ""
  var stateWrapper: StateWrapper? = null

  var inactive = false
    set(value) {
      field = value
      super.setVisibility(if (value) View.INVISIBLE else requestedVisibility)
    }

  override fun setVisibility(visibility: Int) {
    requestedVisibility = visibility
    super.setVisibility(if (inactive) View.INVISIBLE else visibility)
  }

  internal fun reportSize(widthPx: Int, heightPx: Int) = stateWrapper.reportContainerSize(this, widthPx, heightPx)

  internal fun model() = TabItemModel(tabId, title, icon, badge)
}

/** The area above the navigation bar. Fabric positions tabs inside it. */
internal class NativeUIXTabsContent(
  context: Context,
  private val onSize: (Int, Int) -> Unit,
  private val onScroll: (consumed: Int, unconsumed: Int) -> Unit,
) : ViewGroup(context) {
  override fun onStartNestedScroll(child: View, target: View, axes: Int): Boolean =
    axes and View.SCROLL_AXIS_VERTICAL != 0

  override fun onNestedScroll(target: View, dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int) {
    onScroll(dyConsumed, dyUnconsumed)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    onSize(w, h)
  }
}

/**
 * Native UIX's app-level tabs: a Material 3 Expressive navigation bar over
 * the tabs React declares. Every tab stays mounted; switching uses Material's
 * fade through. System back on another tab returns to the first one, as
 * Material navigation does.
 */
class NativeUIXTabsView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  internal val tabs = mutableListOf<NativeUIXTabView>()
  private var selectedId = ""
  private val items = mutableStateOf<List<TabItemModel>>(emptyList())
  private val selection = mutableStateOf("")
  internal val content = NativeUIXTabsContent(
    context,
    { w, h -> tabs.forEach { it.reportSize(w, h) } },
    { consumed, unconsumed -> scrolled(consumed, unconsumed) },
  )

  /** `onScrollDown`, `onScrollUp`, or anything else to keep the bar. */
  var minimizeBehavior = "automatic"
    set(value) {
      field = value
      scrollHidden = false
      updateBar()
    }
  private var scrollHidden = false

  // Material's hide-on-scroll: the bar slides away with scrolling in one
  // direction and comes back with the other.
  // Hiding needs content that actually scrolled; showing follows any drag
  // the other way, even at the edge of content that cannot scroll further.
  private fun scrolled(consumed: Int, unconsumed: Int) {
    val hide = when (minimizeBehavior) {
      "onScrollDown" -> if (consumed > 0) true else if (consumed + unconsumed < 0) false else return
      "onScrollUp" -> if (consumed < 0) true else if (consumed + unconsumed > 0) false else return
      else -> return
    }
    if (hide != scrollHidden) {
      scrollHidden = hide
      updateBar()
    }
  }

  private val bar = ComposeView(context).apply {
    setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnDetachedFromWindow)
    setContent { TabsBar(items.value, selection.value) { id -> selectByUser(id) } }
  }

  private val backCallback = object : OnBackPressedCallback(false) {
    override fun handleOnBackPressed() {
      tabs.firstOrNull()?.let { selectByUser(it.tabId) }
    }
  }

  init {
    content.setBackgroundColor(MaterialColors.getColor(materialContext(context), com.google.android.material.R.attr.colorSurface, 0))
    addView(content, LayoutParams(MATCH_PARENT, MATCH_PARENT))
    addView(bar, LayoutParams(MATCH_PARENT, WRAP_CONTENT, Gravity.BOTTOM))
    // Tabs end at the navigation bar.
    bar.addOnLayoutChangeListener { _, _, top, _, bottom, _, _, _, _ -> if (!barHidden) sizeContent(bottom - top) }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    sizeContent(if (barHidden) 0 else bar.height)
  }

  private fun sizeContent(barHeight: Int) {
    val height = (this.height - barHeight).coerceAtLeast(0)
    content.resizeHeight(height)
  }

  override fun onNightModeChanged() {
    content.setBackgroundColor(MaterialColors.getColor(materialContext(context), com.google.android.material.R.attr.colorSurface, 0))
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val activity = (context as? ThemedReactContext)?.currentActivity as? ComponentActivity
    activity?.onBackPressedDispatcher?.addCallback(backCallback)
  }

  override fun onDetachedFromWindow() {
    backCallback.remove()
    super.onDetachedFromWindow()
  }

  internal fun addTab(tab: NativeUIXTabView, index: Int) {
    tabs.add(index, tab)
    content.addView(tab)
    tab.reportSize(content.width, content.height)
    tabsChanged()
  }

  internal fun removeTab(index: Int) {
    val tab = tabs.removeAt(index)
    tab.inactive = false
    content.removeView(tab)
    tabsChanged()
  }

  internal fun tabsChanged() {
    items.value = tabs.map { it.model() }
    // Compose resizes the bar while this host measures, where a layout
    // request is dropped; measure again once the new bar is composed.
    bar.post { requestLayout() }
    applySelection()
  }

  /** React's selection; programmatic, without a report back. */
  fun select(id: String) {
    if (id == selectedId) return
    show(id)
  }

  private fun selectByUser(id: String) {
    if (id == selectedId) {
      // Re-selecting a tab returns its Stack to the first route.
      tabs.firstOrNull { it.tabId == id }?.let { firstStack(it) }?.popToRootNatively()
      return
    }
    show(id)
    dispatchNativeEvent("topTabChange", Arguments.createMap().apply { putString("id", id) })
  }

  private fun firstStack(root: View): NativeUIXStackView? {
    val queue = ArrayDeque<View>().apply { add(root) }
    while (queue.isNotEmpty()) {
      val view = queue.removeFirst()
      if (view is NativeUIXStackView) return view
      if (view is ViewGroup) for (i in 0 until view.childCount) queue.add(view.getChildAt(i))
    }
    return null
  }

  private var barHidden = false

  /**
   * Another route came on top: the bar shows again, as after navigation in
   * Material and UIKit; a short route could not scroll it back.
   */
  internal fun routeChanged() {
    scrollHidden = false
    updateBar()
  }

  /** Follows the route on top of the selected tab's Stack. */
  internal fun updateBar() {
    val selected = tabs.firstOrNull { it.tabId == selectedId } ?: return
    setBarHidden(scrollHidden || firstStack(selected)?.coversTabBar == true)
  }

  /** A route that covers the tab bar slides the bar down and takes its space. */
  private fun setBarHidden(hidden: Boolean) {
    if (hidden == barHidden) return
    barHidden = hidden
    sizeContent(if (hidden) 0 else bar.height)
    val distance = if (hidden) bar.height.toFloat() else 0f
    if (isAttachedToWindow && isLaidOut) {
      bar.animate().translationY(distance).setDuration(250).start()
    } else {
      bar.translationY = distance
    }
  }

  private fun show(id: String) {
    scrollHidden = false
    if (isAttachedToWindow && isLaidOut && selectedId.isNotEmpty()) {
      val transition: Transition = MaterialFadeThrough()
      TransitionManager.beginDelayedTransition(content, transition)
    }
    selectedId = id
    applySelection()
  }

  private fun applySelection() {
    for (tab in tabs) tab.inactive = tab.tabId != selectedId
    selection.value = selectedId
    updateBackCallback()
    updateBar()
  }

  private var isAggregatedVisible = true

  // Tabs covered by a route pushed over them must not take system back.
  override fun onVisibilityAggregated(isVisible: Boolean) {
    super.onVisibilityAggregated(isVisible)
    isAggregatedVisible = isVisible
    updateBackCallback()
  }

  private fun updateBackCallback() {
    backCallback.isEnabled = isAggregatedVisible && tabs.isNotEmpty() && tabs.first().tabId != selectedId
  }
}

@Composable
private fun TabsBar(items: List<TabItemModel>, selected: String, onSelect: (String) -> Unit) {
  if (items.isEmpty()) return
  val context = LocalContext.current
  val dark = isSystemInDarkTheme()
  val colors = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    dark -> darkColorScheme()
    else -> lightColorScheme()
  }
  MaterialExpressiveTheme(colorScheme = colors) {
    // ShortNavigationBar (Expressive) in 1.5.0-alpha06 placed only the selected
    // item here; retried on each Material 3 upgrade (EV-0010).
    NavigationBar {
      for (item in items) {
        NavigationBarItem(
          selected = item.id == selected,
          onClick = { onSelect(item.id) },
          icon = {
            BadgedBox(badge = { if (item.badge.isNotEmpty()) Badge { Text(item.badge) } }) {
              TabIcon(item.icon)
            }
          },
          label = { Text(item.title) },
        )
      }
    }
  }
}

/** An app drawable of that name, else the Material core icon of that name. */
@SuppressLint("DiscouragedApi")
@Composable
private fun TabIcon(name: String) {
  if (name.isEmpty()) return
  val context = LocalContext.current
  val drawable = context.resources.getIdentifier(name, "drawable", context.packageName)
  if (drawable != 0) {
    Icon(painterResource(drawable), contentDescription = null)
    return
  }
  materialIcon(name)?.let { Icon(it, contentDescription = null) }
}

private val iconCache = mutableMapOf<String, ImageVector?>()

// Core icons are Kotlin extension properties (Icons.Filled.Home is
// HomeKt.getHome(Icons.Filled)); resolved by name once.
private fun materialIcon(name: String): ImageVector? = iconCache.getOrPut(name) {
  runCatching {
    Class.forName("androidx.compose.material.icons.filled.${name}Kt")
      .getMethod("get$name", Icons.Filled::class.java)
      .invoke(null, Icons.Filled) as ImageVector
  }.getOrNull()
}

class NativeUIXTabsManager :
  ViewGroupManager<NativeUIXTabsView>(),
  NativeUIXTabsManagerInterface<NativeUIXTabsView> {
  private val delegate = NativeUIXTabsManagerDelegate(this)

  override fun getName(): String = "NativeUIXTabs"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXTabsView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXTabsView(reactContext)

  override fun setSelectedId(view: NativeUIXTabsView, value: String?) = view.select(value.orEmpty())

  override fun setMinimizeBehavior(view: NativeUIXTabsView, value: String?) {
    view.minimizeBehavior = value ?: "automatic"
  }

  // React's children are the tabs; they live in the content area.
  override fun addView(parent: NativeUIXTabsView, child: View, index: Int) =
    parent.addTab(child as NativeUIXTabView, index)

  override fun removeViewAt(parent: NativeUIXTabsView, index: Int) = parent.removeTab(index)

  override fun getChildCount(parent: NativeUIXTabsView): Int = parent.tabs.size

  override fun getChildAt(parent: NativeUIXTabsView, index: Int): View = parent.tabs[index]
}

class NativeUIXTabManager :
  ViewGroupManager<NativeUIXTabView>(),
  NativeUIXTabManagerInterface<NativeUIXTabView> {
  private val delegate = NativeUIXTabManagerDelegate(this)

  override fun getName(): String = "NativeUIXTab"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXTabView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXTabView(reactContext)

  override fun updateState(view: NativeUIXTabView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    (view.parent as? NativeUIXTabsContent)?.let { view.reportSize(it.width, it.height) }
    return null
  }

  override fun onAfterUpdateTransaction(view: NativeUIXTabView) {
    super.onAfterUpdateTransaction(view)
    ((view.parent as? NativeUIXTabsContent)?.parent as? NativeUIXTabsView)?.tabsChanged()
  }

  override fun setTabId(view: NativeUIXTabView, value: String?) {
    view.tabId = value.orEmpty()
  }

  override fun setTitle(view: NativeUIXTabView, value: String?) {
    view.title = value.orEmpty()
  }

  override fun setIosIcon(view: NativeUIXTabView, value: String?) {}

  override fun setAndroidIcon(view: NativeUIXTabView, value: String?) {
    view.icon = value.orEmpty()
  }

  override fun setBadge(view: NativeUIXTabView, value: String?) {
    view.badge = value.orEmpty()
  }
}
