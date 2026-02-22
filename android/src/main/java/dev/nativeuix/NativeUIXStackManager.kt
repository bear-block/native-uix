package dev.nativeuix

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.TypedValue
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.ImageView
import androidx.activity.BackEventCompat
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.content.res.AppCompatResources
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.transition.Transition
import androidx.transition.TransitionManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableNativeMap
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
import com.google.android.material.appbar.AppBarLayout
import com.google.android.material.appbar.CollapsingToolbarLayout
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.color.MaterialColors
import com.google.android.material.transition.MaterialSharedAxis
import kotlin.math.abs

private const val TRAILING_ACTION = 1

/**
 * One route of a NativeUIXStack. Fabric sets every view VISIBLE on each layout
 * update, so a route that is not on top overrides that and stays invisible.
 */
class NativeUIXStackScreenView(context: ThemedReactContext) : ReactViewGroup(context) {
  private var requestedVisibility = View.VISIBLE

  var routeKey = ""
  var title = ""
  var headerSize = "large"
  var subtitle = ""
  var trailingId = ""
  var trailingLabel = ""
  var trailingDisabled = false

  /** Popped natively (back, Up, predictive back) before React removed it. */
  internal var popped = false

  /** Added by React and not yet shown; decides the transition direction. */
  internal var added = false

  /** App bar offset while this route was on top, restored on return. */
  internal var appBarOffset = 0

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
  internal fun reportSize(widthPx: Int, heightPx: Int) {
    val state = stateWrapper ?: return
    if (widthPx <= 0 || heightPx <= 0) return
    val density = resources.displayMetrics.density
    val width = widthPx / density
    val height = heightPx / density
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

  internal fun emitHeaderAction() {
    dispatchNativeEvent("topHeaderAction", Arguments.createMap().apply { putString("id", trailingId) })
  }
}

/**
 * The area below the app bar. Fabric positions routes inside it; it measures
 * and lays out only its own snapshots of removed routes.
 */
internal class NativeUIXStackContent(context: Context, private val onSize: (Int, Int) -> Unit) : ViewGroup(context) {
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

  private val coordinator = CoordinatorLayout(themed)
  internal val content = NativeUIXStackContent(themed) { w, h -> screens.forEach { it.reportSize(w, h) } }
  private lateinit var appBar: AppBarLayout
  private lateinit var collapsing: CollapsingToolbarLayout
  private lateinit var toolbar: MaterialToolbar
  private var largeScrim: android.graphics.drawable.Drawable? = null

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
    coordinator.fitsSystemWindows = true
    content.setBackgroundColor(MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurface, 0))
    coordinator.addView(
      content,
      CoordinatorLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT).apply { behavior = AppBarLayout.ScrollingViewBehavior() },
    )
    buildAppBar()
    addView(coordinator, LayoutParams(MATCH_PARENT, MATCH_PARENT))
  }

  private fun buildAppBar() {
    if (this::appBar.isInitialized) coordinator.removeView(appBar)
    appBar = AppBarLayout(themed)
    collapsing = CollapsingToolbarLayout(themed, null, com.google.android.material.R.attr.collapsingToolbarLayoutLargeStyle)
    collapsing.setExpandedSubtitleTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_TitleMedium)
    collapsing.setCollapsedSubtitleTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyMedium)
    val subtitleColor = MaterialColors.getColor(themed, com.google.android.material.R.attr.colorOnSurfaceVariant, 0)
    collapsing.setExpandedSubtitleColor(subtitleColor)
    collapsing.setCollapsedSubtitleTextColor(subtitleColor)
    largeScrim = collapsing.contentScrim
    toolbar = MaterialToolbar(themed)
    toolbar.setNavigationOnClickListener { popNatively(animated = true) }
    toolbar.setOnMenuItemClickListener { item: MenuItem ->
      if (item.itemId == TRAILING_ACTION) shown?.emitHeaderAction()
      true
    }
    collapsing.addView(
      toolbar,
      CollapsingToolbarLayout.LayoutParams(MATCH_PARENT, attrSize(androidx.appcompat.R.attr.actionBarSize)).apply {
        collapseMode = CollapsingToolbarLayout.LayoutParams.COLLAPSE_MODE_PIN
      },
    )
    appBar.addView(collapsing, AppBarLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    appBar.addOnOffsetChangedListener { _, offset -> shown?.appBarOffset = offset }
    // Edge to edge: the app bar extends under the status bar and keeps its
    // content below it, as Material's own layouts do.
    appBar.fitsSystemWindows = true
    collapsing.fitsSystemWindows = true
    coordinator.addView(appBar, 0, CoordinatorLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    coordinator.requestApplyInsets()
    shown?.let { applyHeader(it) }
  }

  override fun onNightModeChanged() {
    themed = materialContext(context)
    content.setBackgroundColor(MaterialColors.getColor(themed, com.google.android.material.R.attr.colorSurface, 0))
    buildAppBar()
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
        val transition: Transition = MaterialSharedAxis(MaterialSharedAxis.X, forward)
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
      target?.let { applyHeader(it); restoreAppBar(it) }
    }
    updateBackCallback()
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
      val transition: Transition = MaterialSharedAxis(MaterialSharedAxis.X, false)
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
    applyHeader(below)
    restoreAppBar(below)
    updateBackCallback()
    dispatchNativeEvent("topNativePop", Arguments.createMap().apply { putString("topKey", below.routeKey) })
  }

  private fun updateBackCallback() {
    backCallback.isEnabled = below(shown) != null
  }

  /** Reapplies the header when the route on top changes its props. */
  internal fun headerChanged(screen: NativeUIXStackScreenView) {
    if (screen === shown) applyHeader(screen)
  }

  private fun applyHeader(screen: NativeUIXStackScreenView) {
    val large = screen.headerSize == "large"
    collapsing.isTitleEnabled = large
    // A compact bar is as tall as its toolbar, which the collapsing layout
    // reads as collapsed; its scrim would tint a bar that should be flat.
    collapsing.contentScrim = if (large) largeScrim else null
    collapsing.title = if (large) screen.title else null
    toolbar.title = if (large) null else screen.title
    val subtitle = screen.subtitle.ifEmpty { null }
    collapsing.subtitle = if (large) subtitle else null
    toolbar.subtitle = if (large) null else subtitle
    collapsing.layoutParams = (collapsing.layoutParams as AppBarLayout.LayoutParams).apply {
      height = if (large) attrSize(com.google.android.material.R.attr.collapsingToolbarLayoutLargeSize) else WRAP_CONTENT
      scrollFlags = if (large) {
        AppBarLayout.LayoutParams.SCROLL_FLAG_SCROLL or
          AppBarLayout.LayoutParams.SCROLL_FLAG_EXIT_UNTIL_COLLAPSED or
          AppBarLayout.LayoutParams.SCROLL_FLAG_SNAP
      } else {
        0
      }
    }
    if (below(screen) != null) {
      toolbar.navigationIcon = AppCompatResources.getDrawable(themed, androidx.appcompat.R.drawable.abc_ic_ab_back_material)
      toolbar.setNavigationContentDescription(androidx.appcompat.R.string.abc_action_bar_up_description)
    } else {
      toolbar.navigationIcon = null
    }
    toolbar.menu.clear()
    if (screen.trailingLabel.isNotEmpty()) {
      toolbar.menu.add(0, TRAILING_ACTION, 0, screen.trailingLabel).apply {
        setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS)
        isEnabled = !screen.trailingDisabled
      }
    }
    requestLayout()
  }

  private fun restoreAppBar(screen: NativeUIXStackScreenView) {
    val offset = screen.appBarOffset
    // The app bar lifts from the route's own scroll view, so a route that is
    // at its top shows a flat bar and a scrolled one a lifted bar.
    val scrolling = firstScrollingView(screen)
    appBar.setLiftOnScrollTargetView(scrolling)
    appBar.isLifted = scrolling?.canScrollVertically(-1) == true
    appBar.post {
      val behavior = (appBar.layoutParams as CoordinatorLayout.LayoutParams).behavior as? AppBarLayout.Behavior
      if (behavior != null && behavior.topAndBottomOffset != offset) {
        behavior.topAndBottomOffset = offset
        appBar.requestLayout()
      }
    }
  }

  private fun firstScrollingView(root: View): View? {
    val queue = ArrayDeque<View>().apply { add(root) }
    while (queue.isNotEmpty()) {
      val view = queue.removeFirst()
      if (view is android.widget.ScrollView || view is androidx.recyclerview.widget.RecyclerView) return view
      if (view is ViewGroup) for (i in 0 until view.childCount) queue.add(view.getChildAt(i))
    }
    return null
  }

  private fun attrSize(attr: Int): Int {
    val value = TypedValue()
    themed.theme.resolveAttribute(attr, value, true)
    return TypedValue.complexToDimensionPixelSize(value.data, resources.displayMetrics)
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
