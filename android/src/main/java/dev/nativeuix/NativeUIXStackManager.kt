// The flexible app bars are experimental in Material 3 1.5 alpha (ADR-0007).
@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.material3.ExperimentalMaterial3ExpressiveApi::class)

package dev.nativeuix

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.ImageView
import androidx.activity.BackEventCompat
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.transition.Transition
import kotlinx.coroutines.launch
import androidx.transition.TransitionManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXStackManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXStackManagerInterface
import com.facebook.react.viewmanagers.NativeUIXStackScreenManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXStackScreenManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.color.MaterialColors
import com.google.android.material.transition.MaterialSharedAxis

/**
 * One route of a NativeUIXStack. Fabric sets every view VISIBLE on each layout
 * update, so a route that is not on top overrides that and stays invisible.
 */
class NativeUIXStackScreenView(context: ThemedReactContext) : ReactViewGroup(context) {
  private var requestedVisibility = View.VISIBLE

  var routeKey = ""
  var title = ""
  var headerSize = "large"
  var headerHidden = false
  var hidesTabBar = false
  /** `push`, or `modal` / `fullScreenModal`: a full-screen dialog. */
  var presentation = "push"
  val presentsModally: Boolean get() = presentation != "push"
  var subtitle = ""
  var trailingId = ""
  var trailingLabel = ""
  var trailingDisabled = false
  var searchEnabled = false
  var searchPlaceholder = ""

  /** Popped natively (back, Up, predictive back) before React removed it. */
  internal var popped = false

  /** Added by React and not yet shown; decides the transition direction. */
  internal var added = false


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

  /** Lays the route out at the content area's size, below the app bar. */
  internal fun reportSize(widthPx: Int, heightPx: Int) = stateWrapper.reportContainerSize(this, widthPx, heightPx)

  internal fun emitSearch(type: String, text: String) {
    dispatchNativeEvent("topSearch", Arguments.createMap().apply {
      putString("type", type)
      putString("text", text)
    })
  }

  internal fun emitHeaderAction() {
    dispatchNativeEvent("topHeaderAction", Arguments.createMap().apply { putString("id", trailingId) })
  }
}

/**
 * The area below the app bar. Fabric positions routes inside it; it measures
 * and lays out only its own snapshots of removed routes. Nested scrolling
 * from a route's scroll view (React Native ScrollView, RecyclerView) is passed
 * to the Compose app bar, which collapses and lifts with it.
 */
internal class NativeUIXStackContent(
  context: Context,
  private val onSize: (Int, Int) -> Unit,
  private val header: StackHeaderBridge,
) : ViewGroup(context) {
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val height = MeasureSpec.getSize(heightMeasureSpec)
    setMeasuredDimension(width, height)
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child !is NativeUIXStackScreenView) {
        child.measure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
      }
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child !is NativeUIXStackScreenView) child.layout(0, 0, r - l, b - t)
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    onSize(w, h)
  }

  override fun onStartNestedScroll(child: View, target: View, axes: Int): Boolean =
    axes and View.SCROLL_AXIS_VERTICAL != 0

  // Views scroll down with positive dy; Compose with negative y.
  override fun onNestedPreScroll(target: View, dx: Int, dy: Int, consumed: IntArray) {
    val connection = header.behavior?.nestedScrollConnection ?: return
    val used = connection.onPreScroll(
      androidx.compose.ui.geometry.Offset(0f, -dy.toFloat()),
      androidx.compose.ui.input.nestedscroll.NestedScrollSource.UserInput,
    )
    consumed[1] = -used.y.toInt()
    // Move the routes now, inside this scroll step: the scroll view measures
    // the next touch against its new position. Waiting for the bar's layout
    // a frame later makes every step overshoot and bounce.
    if (used.y != 0f) header.follow?.invoke()
  }

  override fun onNestedScroll(target: View, dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int) {
    header.behavior?.nestedScrollConnection?.onPostScroll(
      androidx.compose.ui.geometry.Offset(0f, -dyConsumed.toFloat()),
      androidx.compose.ui.geometry.Offset(0f, -dyUnconsumed.toFloat()),
      androidx.compose.ui.input.nestedscroll.NestedScrollSource.UserInput,
    )
    header.follow?.invoke()
    dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, null)
  }

  // Settles a large bar fully expanded or collapsed when scrolling stops.
  override fun onStopNestedScroll(child: View) {
    stopNestedScroll()
    val connection = header.behavior?.nestedScrollConnection ?: return
    header.scope?.launch {
      connection.onPostFling(androidx.compose.ui.unit.Velocity.Zero, androidx.compose.ui.unit.Velocity.Zero)
    }
  }

  // Scrolling continues upward to an enclosing container (Tabs hides its bar).
  init {
    isNestedScrollingEnabled = true
  }

  override fun onNestedScrollAccepted(child: View, target: View, axes: Int) {
    super.onNestedScrollAccepted(child, target, axes)
    startNestedScroll(axes)
  }
}

/**
 * Native UIX's stack: one Material app bar over the routes React declares.
 * Push and pop use Material's shared axis on the real views; system back,
 * the Up button and predictive back (Android 14+) pop natively and report the
 * committed pop once. Routes below the top stay mounted, keeping their state
 * and scroll positions.
 */
class NativeUIXStackView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private var themed: Context = materialContext(context)
  internal val screens = mutableListOf<NativeUIXStackScreenView>()
  private var shown: NativeUIXStackScreenView? = null
  private val snapshots = mutableListOf<View>()
  private var updatePending = false
  private var gestureActive = false

  private val headerBridge = StackHeaderBridge()
  private val headerModel = mutableStateOf<StackHeaderModel?>(null)
  internal val content = NativeUIXStackContent(themed, { w, h -> screens.forEach { it.reportSize(w, h) } }, headerBridge)
  private val header = ComposeView(context).apply {
    setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnDetachedFromWindow)
    setContent {
      headerModel.value?.let { model ->
        StackHeader(
          model = model,
          bridge = headerBridge,
          onBack = { popNatively(animated = true) },
          onTrailing = { shown?.emitHeaderAction() },
          onSearch = { type, text -> shown?.emitSearch(type, text) },
        )
      }
    }
  }

  private val applyRoutes = Runnable { updatePending = false; applyRoutesNow() }

  private val backCallback = object : OnBackPressedCallback(false) {
    override fun handleOnBackStarted(backEvent: BackEventCompat) {
      val below = below(shown) ?: return
      gestureActive = true
      below.inactive = false
    }

    override fun handleOnBackProgressed(backEvent: BackEventCompat) {
      val top = shown ?: return
      if (!gestureActive) return
      // Material 3 predictive back: the route shrinks and moves toward the
      // swiped edge, uncovering the one below.
      val progress = backEvent.progress
      val direction = if (backEvent.swipeEdge == BackEventCompat.EDGE_LEFT) 1f else -1f
      top.scaleX = 1f - 0.1f * progress
      top.scaleY = 1f - 0.1f * progress
      top.translationX = direction * dp(24) * progress
    }

    override fun handleOnBackCancelled() {
      val top = shown ?: return
      gestureActive = false
      top.animate().scaleX(1f).scaleY(1f).translationX(0f).setDuration(150)
        .setListener(object : AnimatorListenerAdapter() {
          override fun onAnimationEnd(animation: Animator) {
            top.animate().setListener(null)
            if (shown === top) below(top)?.inactive = true
          }
        })
    }

    override fun handleOnBackPressed() {
      val top = shown ?: return
      if (gestureActive) {
        gestureActive = false
        top.animate().alpha(0f).setDuration(100).setListener(object : AnimatorListenerAdapter() {
          override fun onAnimationEnd(animation: Animator) {
            top.animate().setListener(null)
            popNatively(animated = false)
          }
        })
      } else {
        popNatively(animated = true)
      }
    }
  }

  init {
    content.setBackgroundColor(MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurface, 0))
    addView(content, LayoutParams(MATCH_PARENT, MATCH_PARENT))
    addView(header, LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    // Routes start below the app bar and follow it while it collapses; their
    // height stays the area below the collapsed bar, so collapsing moves them
    // without a React layout.
    header.addOnLayoutChangeListener { _, _, top, _, bottom, _, _, _, _ ->
      val offset = headerOffset()
      expandedHeader = (bottom - top) - offset
      content.translationY = (bottom - top).toFloat()
      // A bar that does not collapse (compact, search) is the real limit of
      // the routes' area.
      if (!headerCollapses) sizeContent()
    }
    headerBridge.follow = {
      if (expandedHeader > 0f) content.translationY = expandedHeader + headerOffset()
    }
  }

  /** Header height with nothing collapsed, from its last layout. */
  private var expandedHeader = 0f

  private fun headerOffset(): Float = headerBridge.behavior?.state?.heightOffset ?: 0f

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    sizeContent()
  }

  // Containers move this stack without laying it out (a rail appearing), so
  // its position is checked before each frame.
  private val location = IntArray(2)
  private val trackStart = android.view.ViewTreeObserver.OnPreDrawListener {
    getLocationInWindow(location)
    val covered = location[0] > 0
    if (headerBridge.startInsetCovered.value != covered) headerBridge.startInsetCovered.value = covered
    true
  }

  private fun sizeContent() {
    val statusBar = ViewCompat.getRootWindowInsets(this)
      ?.getInsets(WindowInsetsCompat.Type.statusBars())?.top ?: 0
    // A route without a header (one hosting Tabs) takes the whole stack; a
    // collapsing bar leaves the area below its collapsed height; any other
    // bar, its measured height.
    val collapsed = when {
      shown?.headerHidden == true -> 0
      headerCollapses || header.height == 0 -> (dp(64) + statusBar).toInt()
      else -> header.height
    }
    val height = (this.height - collapsed).coerceAtLeast(0)
    content.resizeHeight(height)
  }

  override fun onNightModeChanged() {
    themed = materialContext(context)
    content.setBackgroundColor(MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurface, 0))
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val activity = (context as? ThemedReactContext)?.currentActivity as? ComponentActivity
    activity?.onBackPressedDispatcher?.addCallback(backCallback)
    viewTreeObserver.addOnPreDrawListener(trackStart)
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(trackStart)
    backCallback.remove()
    super.onDetachedFromWindow()
  }

  internal fun addScreen(screen: NativeUIXStackScreenView, index: Int) {
    val next = screens.getOrNull(index)
    screens.add(index, screen)
    screen.added = true
    screen.popped = false
    // Hidden until the routes are applied, after this mounting batch.
    screen.inactive = true
    content.addView(screen, if (next != null) content.indexOfChild(next) else content.childCount)
    screen.reportSize(content.width, content.height)
    scheduleApplyRoutes()
  }

  internal fun removeScreen(index: Int) {
    val screen = screens.removeAt(index)
    if (screen === shown && !screen.popped && screen.width > 0 && screen.height > 0 && isAttachedToWindow) {
      // React removed the visible route: animate a picture of it out, as
      // Fabric takes the real view apart after this.
      val bitmap = Bitmap.createBitmap(screen.width, screen.height, Bitmap.Config.ARGB_8888)
      screen.draw(Canvas(bitmap))
      val snapshot = ImageView(themed).apply { setImageBitmap(bitmap) }
      content.addView(snapshot, content.indexOfChild(screen))
      snapshots.add(snapshot)
    }
    if (screen === shown) shown = null
    screen.inactive = false
    screen.animate().cancel()
    screen.scaleX = 1f
    screen.scaleY = 1f
    screen.translationX = 0f
    screen.alpha = 1f
    content.removeView(screen)
    scheduleApplyRoutes()
  }

  private fun scheduleApplyRoutes() {
    if (updatePending) return
    updatePending = true
    post(applyRoutes)
  }

  private fun applyRoutesNow() {
    val target = screens.lastOrNull { !it.popped }
    val previous = shown
    val animate = isAttachedToWindow && target != null && (previous != null || snapshots.isNotEmpty())
    if (target !== previous || snapshots.isNotEmpty()) {
      if (animate && target !== previous) {
        val forward = target?.added == true
        // Into or out of a modal: the full-screen dialog rises and falls.
        val axis = if (modalRoot(target) !== shownModalRoot) MaterialSharedAxis.Y else MaterialSharedAxis.X
        val transition: Transition = MaterialSharedAxis(axis, forward)
        TransitionManager.beginDelayedTransition(content, transition)
      }
      snapshots.forEach { content.removeView(it) }
      snapshots.clear()
    }
    for (screen in screens) {
      screen.inactive = screen !== target
      screen.added = false
    }
    if (target !== previous) {
      shown = target
      target?.let {
        shownModalRoot = modalRoot(it)
        applyHeader(it)
      }
    }
    updateBackCallback()
  }

  /** First route of the modal the route is in; null on the first stack. */
  private var shownModalRoot: NativeUIXStackScreenView? = null

  private fun modalRoot(screen: NativeUIXStackScreenView?): NativeUIXStackScreenView? {
    val active = screens.filter { !it.popped }
    val index = active.indexOf(screen)
    if (index < 0) return null
    return (index downTo 1).map { active[it] }.firstOrNull { it.presentsModally }
  }

  private fun below(screen: NativeUIXStackScreenView?): NativeUIXStackScreenView? {
    val active = screens.filter { !it.popped }
    val index = active.indexOf(screen)
    return if (index > 0) active[index - 1] else null
  }

  private fun popNatively(animated: Boolean) {
    val top = shown ?: return
    val below = below(top) ?: return
    if (animated && isAttachedToWindow) {
      val axis = if (modalRoot(top) !== modalRoot(below)) MaterialSharedAxis.Y else MaterialSharedAxis.X
      val transition: Transition = MaterialSharedAxis(axis, false)
      TransitionManager.beginDelayedTransition(content, transition)
    }
    top.popped = true
    top.inactive = true
    top.scaleX = 1f
    top.scaleY = 1f
    top.translationX = 0f
    top.alpha = 1f
    below.inactive = false
    shown = below
    shownModalRoot = modalRoot(below)
    applyHeader(below)
    updateBackCallback()
    dispatchNativeEvent("topNativePop", Arguments.createMap().apply { putString("topKey", below.routeKey) })
  }

  private var shownForTabs: NativeUIXStackScreenView? = null

  /** The route on top covers the tab bar, as do modals (full-screen dialogs). */
  internal val coversTabBar: Boolean
    get() = shownForTabs?.let { it.hidesTabBar || modalRoot(it) != null } == true

  /** A modal is on top: it covers the tab bar's accessory too. */
  internal val showsModal: Boolean get() = shownForTabs?.let { modalRoot(it) != null } == true

  private fun enclosingTabs(): NativeUIXTabsView? {
    var parent = parent
    while (parent != null) {
      if (parent is NativeUIXTabsView) return parent
      parent = parent.parent
    }
    return null
  }

  /** Re-selected tab: back to the first route, as Material navigation does. */
  internal fun popToRootNatively() {
    val active = screens.filter { !it.popped }
    val root = active.firstOrNull() ?: return
    val top = shown ?: return
    if (root === top) return
    if (isAttachedToWindow) {
      val axis = if (modalRoot(top) != null) MaterialSharedAxis.Y else MaterialSharedAxis.X
      val transition: Transition = MaterialSharedAxis(axis, false)
      TransitionManager.beginDelayedTransition(content, transition)
    }
    for (screen in active.drop(1)) {
      screen.popped = true
      screen.inactive = true
    }
    root.inactive = false
    shown = root
    shownModalRoot = null
    applyHeader(root)
    updateBackCallback()
    dispatchNativeEvent("topNativePop", Arguments.createMap().apply { putString("topKey", root.routeKey) })
  }

  private fun updateBackCallback() {
    // A stack in a hidden tab must not take system back.
    backCallback.isEnabled = below(shown) != null && isAggregatedVisible
  }

  private var isAggregatedVisible = true

  override fun onVisibilityAggregated(isVisible: Boolean) {
    super.onVisibilityAggregated(isVisible)
    isAggregatedVisible = isVisible
    updateBackCallback()
  }

  /** Reapplies the header when the route on top changes its props. */
  internal fun headerChanged(screen: NativeUIXStackScreenView) {
    if (screen === shown) applyHeader(screen)
  }

  private val headerCollapses: Boolean
    get() = shown?.let { it.headerSize == "large" && !it.searchEnabled && !it.headerHidden } == true

  private fun applyHeader(screen: NativeUIXStackScreenView) {
    val routeChanged = shownForTabs !== screen
    shownForTabs = screen
    enclosingTabs()?.let { if (routeChanged) it.routeChanged() else it.updateBar() }
    sizeContent()
    if (screen.headerHidden) {
      headerModel.value = null
      content.translationY = 0f
      header.post { requestLayout() }
      return
    }
    headerModel.value = StackHeaderModel(
      routeKey = screen.routeKey,
      title = screen.title,
      large = screen.headerSize == "large",
      subtitle = screen.subtitle,
      trailingLabel = screen.trailingLabel,
      trailingDisabled = screen.trailingDisabled,
      canGoBack = below(screen) != null,
      closes = modalRoot(screen) === screen,
      search = screen.searchEnabled,
      searchPlaceholder = screen.searchPlaceholder,
    )
    // Compose resizes the bar while this host measures, where a layout
    // request is dropped; measure again once the new bar is composed.
    header.post { requestLayout() }
  }

  private fun dp(value: Int): Float = value * resources.displayMetrics.density
}

class NativeUIXStackManager :
  ViewGroupManager<NativeUIXStackView>(),
  NativeUIXStackManagerInterface<NativeUIXStackView> {
  private val delegate = NativeUIXStackManagerDelegate(this)

  override fun getName(): String = "NativeUIXStack"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXStackView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXStackView(reactContext)

  // React's children are the routes; they live in the content area, not in
  // this view.
  override fun addView(parent: NativeUIXStackView, child: View, index: Int) =
    parent.addScreen(child as NativeUIXStackScreenView, index)

  override fun removeViewAt(parent: NativeUIXStackView, index: Int) = parent.removeScreen(index)

  override fun getChildCount(parent: NativeUIXStackView): Int = parent.screens.size

  override fun getChildAt(parent: NativeUIXStackView, index: Int): View = parent.screens[index]
}

class NativeUIXStackScreenManager :
  ViewGroupManager<NativeUIXStackScreenView>(),
  NativeUIXStackScreenManagerInterface<NativeUIXStackScreenView> {
  private val delegate = NativeUIXStackScreenManagerDelegate(this)

  override fun getName(): String = "NativeUIXStackScreen"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXStackScreenView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXStackScreenView(reactContext)

  override fun updateState(view: NativeUIXStackScreenView, props: ReactStylesDiffMap, stateWrapper: StateWrapper): Any? {
    view.stateWrapper = stateWrapper
    (view.parent as? NativeUIXStackContent)?.let { view.reportSize(it.width, it.height) }
    return null
  }

  override fun onAfterUpdateTransaction(view: NativeUIXStackScreenView) {
    super.onAfterUpdateTransaction(view)
    ((view.parent as? NativeUIXStackContent)?.parent?.parent as? NativeUIXStackView)?.headerChanged(view)
  }

  override fun setRouteKey(view: NativeUIXStackScreenView, value: String?) {
    view.routeKey = value.orEmpty()
  }

  override fun setScreenTitle(view: NativeUIXStackScreenView, value: String?) {
    view.title = value.orEmpty()
  }

  override fun setSearchEnabled(view: NativeUIXStackScreenView, value: Boolean) {
    view.searchEnabled = value
  }

  override fun setSearchPlaceholder(view: NativeUIXStackScreenView, value: String?) {
    view.searchPlaceholder = value.orEmpty()
  }

  // iOS only: placement and hiding of the search bar while scrolling.
  override fun setSearchPlacement(view: NativeUIXStackScreenView, value: String?) {}

  override fun setSearchHidesWhenScrolling(view: NativeUIXStackScreenView, value: Boolean) {}

  override fun setHidesTabBar(view: NativeUIXStackScreenView, value: Boolean) {
    view.hidesTabBar = value
  }

  override fun setPresentation(view: NativeUIXStackScreenView, value: String?) {
    view.presentation = value ?: "push"
  }

  override fun setHeaderHidden(view: NativeUIXStackScreenView, value: Boolean) {
    view.headerHidden = value
  }

  override fun setHeaderSize(view: NativeUIXStackScreenView, value: String?) {
    view.headerSize = value ?: "large"
  }

  override fun setHeaderSubtitle(view: NativeUIXStackScreenView, value: String?) {
    view.subtitle = value.orEmpty()
  }

  override fun setTrailingId(view: NativeUIXStackScreenView, value: String?) {
    view.trailingId = value.orEmpty()
  }

  override fun setTrailingLabel(view: NativeUIXStackScreenView, value: String?) {
    view.trailingLabel = value.orEmpty()
  }

  override fun setTrailingDisabled(view: NativeUIXStackScreenView, value: Boolean) {
    view.trailingDisabled = value
  }
}
