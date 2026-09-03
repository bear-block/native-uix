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
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.viewmanagers.NativeUIXTabManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabsAccessoryManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabsAccessoryManagerInterface
import com.facebook.react.viewmanagers.NativeUIXTabManagerInterface
import com.facebook.react.viewmanagers.NativeUIXTabsManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTabsManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.color.MaterialColors
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.ShapeAppearanceModel
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

  var searchRole = false

  // A search tab without an icon of its own shows the Material search icon.
  internal fun model() = TabItemModel(tabId, title, icon.ifEmpty { if (searchRole) "Search" else "" }, badge)
}

/** NativeUIXTabsAccessory: React content sized to the accessory surface. */
class NativeUIXTabsAccessoryView(context: ThemedReactContext) : ReactViewGroup(context) {
  var stateWrapper: StateWrapper? = null

  internal fun reportSize(widthPx: Int, heightPx: Int) = stateWrapper.reportContainerSize(this, widthPx, heightPx)
}

/**
 * The accessory's floating Material surface above the navigation bar; Fabric
 * positions the content view in it.
 */
internal class NativeUIXTabsAccessorySlot(context: Context) : ViewGroup(context) {
  init {
    applyTheme()
    clipToOutline = true
  }

  fun applyTheme() {
    val themed = materialContext(context)
    background = MaterialShapeDrawable(
      ShapeAppearanceModel.builder().setAllCornerSizes(28 * resources.displayMetrics.density).build(),
    ).apply {
      fillColor = android.content.res.ColorStateList.valueOf(
        MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurfaceContainerHigh, 0),
      )
    }
    elevation = 3 * resources.displayMetrics.density
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    for (i in 0 until childCount) (getChildAt(i) as? NativeUIXTabsAccessoryView)?.reportSize(w, h)
  }
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

  internal val accessorySlot = NativeUIXTabsAccessorySlot(context).apply { visibility = View.GONE }
  internal var accessory: NativeUIXTabsAccessoryView? = null
    private set

  init {
    content.setBackgroundColor(MaterialColors.getColor(materialContext(context), com.google.android.material.R.attr.colorSurface, 0))
    addView(content, LayoutParams(MATCH_PARENT, MATCH_PARENT))
    addView(
      accessorySlot,
      LayoutParams(MATCH_PARENT, dp(56), Gravity.BOTTOM).apply {
        leftMargin = dp(16)
        rightMargin = dp(16)
      },
    )
    addView(bar, LayoutParams(MATCH_PARENT, WRAP_CONTENT, Gravity.BOTTOM))
    // Tabs end at the navigation bar (and the accessory above it).
    bar.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      sizeContent()
      placeAccessory(animated = false)
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    sizeContent()
    placeAccessory(animated = false)
  }

  private val accessoryShown: Boolean get() = accessory != null && !underModal

  private fun navigationInset(): Int =
    ViewCompat.getRootWindowInsets(this)?.getInsets(WindowInsetsCompat.Type.navigationBars())?.bottom ?: 0

  private fun sizeContent() {
    // With the bar away, an accessory still keeps the system navigation area.
    val barSpace = when {
      !barHidden -> bar.height
      accessoryShown -> navigationInset()
      else -> 0
    }
    val accessorySpace = if (accessoryShown) accessorySlot.layoutParams.height + dp(16) else 0
    content.resizeHeight((this.height - barSpace - accessorySpace).coerceAtLeast(0))
  }

  /**
   * The accessory floats 8 dp above the navigation bar. When the bar slides
   * away (scrolling, a `hidesTabBar` route) it moves down and stays, as
   * UIKit keeps it; a modal covers it.
   */
  private fun placeAccessory(animated: Boolean) {
    if (accessory == null) return
    val target = when {
      underModal -> accessorySlot.layoutParams.height.toFloat() + dp(8)
      barHidden -> -(navigationInset() + dp(8)).toFloat()
      else -> -(bar.height + dp(8)).toFloat()
    }
    if (animated && isAttachedToWindow && isLaidOut) {
      accessorySlot.animate().translationY(target).setDuration(250).start()
    } else {
      accessorySlot.animate().cancel()
      accessorySlot.translationY = target
    }
  }

  internal fun setAccessory(view: NativeUIXTabsAccessoryView?) {
    accessory?.let { accessorySlot.removeView(it) }
    accessory = view
    if (view != null) {
      accessorySlot.addView(view)
      view.reportSize(accessorySlot.width, accessorySlot.height)
    }
    accessorySlot.visibility = if (view != null) View.VISIBLE else View.GONE
    sizeContent()
    placeAccessory(animated = false)
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  override fun onNightModeChanged() {
    content.setBackgroundColor(MaterialColors.getColor(materialContext(context), com.google.android.material.R.attr.colorSurface, 0))
    accessorySlot.applyTheme()
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

  /** The selected tab's route covers the tab bar. */
  private var covered = false

  /** The selected tab shows a modal, which covers the accessory too. */
  private var underModal = false

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
    val stack = firstStack(selected)
    covered = stack?.coversTabBar == true
    underModal = stack?.showsModal == true
    setBarHidden(scrollHidden || covered)
  }

  /** A route that covers the tab bar slides the bar down and takes its space. */
  private fun setBarHidden(hidden: Boolean) {
    val changed = hidden != barHidden
    barHidden = hidden
    sizeContent()
    if (changed) {
      val distance = if (hidden) bar.height.toFloat() else 0f
      if (isAttachedToWindow && isLaidOut) {
        bar.animate().translationY(distance).setDuration(250).start()
      } else {
        bar.translationY = distance
      }
    }
    placeAccessory(animated = true)
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

  // React's children are the tabs, which live in the content area, then the
  // optional accessory, which lives in its surface.
  override fun addView(parent: NativeUIXTabsView, child: View, index: Int) {
    if (child is NativeUIXTabsAccessoryView) parent.setAccessory(child) else parent.addTab(child as NativeUIXTabView, index)
  }

  override fun removeViewAt(parent: NativeUIXTabsView, index: Int) {
    if (index == parent.tabs.size && parent.accessory != null) parent.setAccessory(null) else parent.removeTab(index)
  }

  override fun getChildCount(parent: NativeUIXTabsView): Int = parent.tabs.size + if (parent.accessory != null) 1 else 0

  override fun getChildAt(parent: NativeUIXTabsView, index: Int): View =
    if (index < parent.tabs.size) parent.tabs[index] else parent.accessory!!
}

class NativeUIXTabsAccessoryManager :
  ViewGroupManager<NativeUIXTabsAccessoryView>(),
  NativeUIXTabsAccessoryManagerInterface<NativeUIXTabsAccessoryView> {
  private val delegate = NativeUIXTabsAccessoryManagerDelegate(this)

  override fun getName(): String = "NativeUIXTabsAccessory"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXTabsAccessoryView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXTabsAccessoryView(reactContext)

  override fun updateState(view: NativeUIXTabsAccessoryView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    (view.parent as? NativeUIXTabsAccessorySlot)?.let { view.reportSize(it.width, it.height) }
    return null
  }
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

  override fun setTabRole(view: NativeUIXTabView, value: String?) {
    view.searchRole = value == "search"
  }

  override fun setBadge(view: NativeUIXTabView, value: String?) {
    view.badge = value.orEmpty()
  }
}
