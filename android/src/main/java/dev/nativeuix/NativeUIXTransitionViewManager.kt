package dev.nativeuix

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import android.widget.ImageView
import androidx.interpolator.view.animation.FastOutSlowInInterpolator
import androidx.transition.Transition
import androidx.transition.TransitionManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTransitionViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTransitionViewManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.transition.MaterialFadeThrough
import com.google.android.material.transition.MaterialSharedAxis

/**
 * Animates children that React adds and removes with Material motion.
 * Incoming children use Material's transition classes. Outgoing children are
 * snapshotted first, because Fabric tears down a removed view's subtree at
 * once; the snapshot fades (and, for shared axis, slides) out in the overlay
 * with this file's own animation, using the Material motion values, since
 * Material's classes need the real view.
 */
class NativeUIXTransitionView(context: ThemedReactContext) : ReactViewGroup(context) {
  var motion = "platform"
  private var transitionPending = false

  init {
    clipChildren = true
  }

  private fun shouldAnimateChildren() = motion != "none" && isAttachedToWindow && isLaidOut && width > 0 && height > 0

  private val preparedSnapshots = HashMap<View, Bitmap>()

  private fun draw(child: View): Bitmap? {
    if (child.width <= 0 || child.height <= 0) return null
    return Bitmap.createBitmap(child.width, child.height, Bitmap.Config.ARGB_8888).also {
      child.draw(Canvas(it))
    }
  }

  /**
   * Called (as a view command) before the batch that replaces children:
   * Fabric removes a subtree's descendants before the subtree root, so a
   * snapshot taken at removal time would be empty.
   */
  fun prepareTransition() {
    if (!shouldAnimateChildren()) return
    discardPreparedSnapshots()
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      draw(child)?.let { preparedSnapshots[child] = it }
    }
    // Kept until the replacing batch adds or removes a child, however long JS
    // takes to commit it (see discardPreparedSnapshotsAfterBatch).
  }

  /** Called on each add or remove: leftovers are dropped once the batch has run. */
  fun discardPreparedSnapshotsAfterBatch() {
    if (preparedSnapshots.isNotEmpty()) post { discardPreparedSnapshots() }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    discardPreparedSnapshots()
  }

  private fun discardPreparedSnapshots() {
    preparedSnapshots.values.forEach(Bitmap::recycle)
    preparedSnapshots.clear()
  }

  fun animateOut(child: View) {
    val prepared = preparedSnapshots.remove(child)
    if (!shouldAnimateChildren()) {
      prepared?.recycle()
      return
    }
    val bitmap = prepared ?: draw(child) ?: return
    val snapshot = ImageView(context).apply {
      setImageBitmap(bitmap)
      measure(
        MeasureSpec.makeMeasureSpec(child.width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(child.height, MeasureSpec.EXACTLY),
      )
      layout(child.left, child.top, child.right, child.bottom)
    }
    overlay.add(snapshot)
    // Material fade through and shared axis: the outgoing view fades out in the
    // first 35% of the 300 ms transition; shared axis also slides 30 dp.
    val animator = snapshot.animate().alpha(0f).setDuration(105).setInterpolator(FastOutSlowInInterpolator())
    if (motion == "sharedAxisX") {
      val forward = if (layoutDirection == LAYOUT_DIRECTION_RTL) 1f else -1f
      snapshot.animate().translationX(forward * 30 * resources.displayMetrics.density)
    }
    animator.withEndAction {
      overlay.remove(snapshot)
      bitmap.recycle()
    }
  }

  fun beginTransitionIfNeeded() {
    if (transitionPending || !shouldAnimateChildren()) return
    val transition: Transition = when (motion) {
      "sharedAxisX" -> MaterialSharedAxis(MaterialSharedAxis.X, true)
      // `platform` and `fadeThrough`: Material's motion for switching content.
      else -> MaterialFadeThrough()
    }
    transitionPending = true
    TransitionManager.beginDelayedTransition(this, transition)
    post { transitionPending = false }
  }
}

class NativeUIXTransitionViewManager :
  ViewGroupManager<NativeUIXTransitionView>(),
  NativeUIXTransitionViewManagerInterface<NativeUIXTransitionView> {
  private val delegate = NativeUIXTransitionViewManagerDelegate(this)

  override fun getName(): String = "NativeUIXTransitionView"

  override fun getDelegate(): ViewManagerDelegate<NativeUIXTransitionView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext) = NativeUIXTransitionView(reactContext)

  override fun setMotion(view: NativeUIXTransitionView, value: String?) {
    view.motion = value ?: "platform"
  }

  override fun addView(parent: NativeUIXTransitionView, child: View, index: Int) {
    parent.discardPreparedSnapshotsAfterBatch()
    parent.beginTransitionIfNeeded()
    super.addView(parent, child, index)
  }

  override fun prepareTransition(view: NativeUIXTransitionView) = view.prepareTransition()

  override fun removeViewAt(parent: NativeUIXTransitionView, index: Int) {
    parent.getChildAt(index)?.let(parent::animateOut)
    parent.discardPreparedSnapshotsAfterBatch()
    parent.beginTransitionIfNeeded()
    super.removeViewAt(parent, index)
  }
}
