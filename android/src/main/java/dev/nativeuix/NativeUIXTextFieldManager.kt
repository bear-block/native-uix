package dev.nativeuix

import android.text.Editable
import android.text.TextWatcher
import android.view.inputmethod.BaseInputConnection
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputConnectionWrapper
import android.view.inputmethod.InputMethodManager
import android.content.Context
import android.widget.FrameLayout
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTextFieldManagerDelegate
import com.facebook.react.viewmanagers.NativeUIXTextFieldManagerInterface
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

class NativeUIXTextFieldView(context: ThemedReactContext) : NativeUIXHostLayout(context) {
  private val container = TextInputLayout(materialContext(context))
  private val field = object : TextInputEditText(container.context) {
    override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
      val original = super.onCreateInputConnection(outAttrs) ?: return null
      return object : InputConnectionWrapper(original, false) {
        override fun finishComposingText(): Boolean {
          val result = super.finishComposingText()
          emitCommittedText()
          return result
        }
        override fun commitText(text: CharSequence?, newCursorPosition: Int): Boolean {
          val result = super.commitText(text, newCursorPosition)
          emitCommittedText()
          return result
        }
      }
    }
  }
  private var eventCount = 0
  private var applying = false
  private var emittedText = ""
  private var secure = false
  private var passwordToggle = false
  private var label: String? = null
  private var placeholder: String? = null
  private var helperText: String? = null
  private var error: String? = null
  init {
    container.boxBackgroundMode = TextInputLayout.BOX_BACKGROUND_OUTLINE
    field.setSingleLine(true)
    field.imeOptions = EditorInfo.IME_ACTION_DONE
    container.addView(field, android.widget.LinearLayout.LayoutParams(MATCH_PARENT, (56 * resources.displayMetrics.density).toInt()))
    addView(container, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    field.addTextChangedListener(object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
      override fun afterTextChanged(s: Editable?) {
        emitCommittedText()
      }
    })
    field.setOnFocusChangeListener { _, focused ->
      dispatchNativeEvent("topFieldFocus", Arguments.createMap().apply { putBoolean("focused", focused) })
    }
    field.setOnEditorActionListener { _, action, _ ->
      if (action != EditorInfo.IME_ACTION_DONE) false else {
        dispatchNativeEvent("topFieldSubmit", Arguments.createMap().apply { putString("text", field.text?.toString().orEmpty()) })
        blurField(); true
      }
    }
  }
  private fun emitCommittedText() {
    val text = field.text ?: return
    if (applying || BaseInputConnection.getComposingSpanStart(text) >= 0 || text.toString() == emittedText) return
    emittedText = text.toString()
    eventCount++
    dispatchNativeEvent("topTextChange", Arguments.createMap().apply {
      putString("text", emittedText); putInt("eventCount", eventCount)
    })
  }
  fun setInitialValue(value: String) {
    if (eventCount == 0 && !field.hasFocus()) reconcile(value, 0)
  }
  fun setVariant(value: String?) {
    val filled = value == "filled"
    container.boxBackgroundMode = if (filled)
      TextInputLayout.BOX_BACKGROUND_FILLED else TextInputLayout.BOX_BACKGROUND_OUTLINE
    val appearance = if (filled) com.google.android.material.R.style.Widget_Material3_TextInputLayout_FilledBox
      else com.google.android.material.R.style.Widget_Material3_TextInputLayout_OutlinedBox
    val attrs = container.context.obtainStyledAttributes(appearance, intArrayOf(
      com.google.android.material.R.attr.boxBackgroundColor,
      com.google.android.material.R.attr.boxStrokeColor,
    ))
    try {
      val fill = attrs.getColorStateList(0) ?: android.content.res.ColorStateList.valueOf(android.graphics.Color.TRANSPARENT)
      container.setBoxBackgroundColorStateList(fill)
      attrs.getColorStateList(1)?.let { container.setBoxStrokeColorStateList(it) }
    } finally { attrs.recycle() }
    val corner = 4 * resources.displayMetrics.density
    container.setBoxCornerRadii(corner, corner, if (filled) 0f else corner, if (filled) 0f else corner)
    val density = resources.displayMetrics.density
    container.boxCollapsedPaddingTop = (8 * density).toInt()
    field.setPaddingRelative((16 * density).toInt(), ((if (filled) 24 else 16) * density).toInt(),
      (16 * density).toInt(), ((if (filled) 8 else 16) * density).toInt())
    if (filled) {
      // Material retains the previous outlined label margin when switching modes.
      val frame = field.parent as android.view.ViewGroup
      frame.layoutParams = (frame.layoutParams as android.widget.LinearLayout.LayoutParams).apply { topMargin = 0 }
    }
  }
  private fun updateHint() {
    container.hint = label?.takeIf { it.isNotEmpty() } ?: placeholder
    container.placeholderText = if (!label.isNullOrEmpty()) placeholder else null
  }
  fun setLabel(value: String?) { label = value; updateHint() }
  fun setPlaceholder(value: String?) { placeholder = value; updateHint() }
  fun setHelperText(value: String?) { helperText = value; updateSupportingText() }
  fun setError(value: String?) { error = value; updateSupportingText() }
  private fun updateSupportingText() {
    val message = error?.takeIf { it.isNotEmpty() }
    container.error = message
    container.helperText = if (message == null) helperText?.takeIf { it.isNotEmpty() } else null
  }
  fun setPasswordToggle(value: Boolean) { passwordToggle = value; updatePasswordToggle() }
  private fun updatePasswordToggle() {
    val mode = if (secure && passwordToggle) TextInputLayout.END_ICON_PASSWORD_TOGGLE else TextInputLayout.END_ICON_NONE
    if (container.endIconMode != mode) {
      val start = field.selectionStart
      val end = field.selectionEnd
      container.endIconMode = mode
      if (start >= 0 && end >= 0) field.setSelection(start.coerceAtMost(field.length()), end.coerceAtMost(field.length()))
    }
  }
  fun setDisabled(disabled: Boolean) { container.isEnabled = !disabled; field.isEnabled = !disabled }
  fun setSecure(secure: Boolean) {
    if (this.secure == secure) return
    val start = field.selectionStart
    val end = field.selectionEnd
    this.secure = secure
    field.inputType = android.text.InputType.TYPE_CLASS_TEXT or
      (if (secure) android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD else android.text.InputType.TYPE_TEXT_VARIATION_NORMAL)
    field.setSingleLine(true)
    // Single-line configuration replaces the transformation; apply masking last.
    field.imeOptions = EditorInfo.IME_ACTION_DONE
    updatePasswordToggle()
    // The previous password end-icon delegate masks again during teardown.
    field.transformationMethod = if (secure)
      android.text.method.PasswordTransformationMethod.getInstance() else null
    if (start >= 0 && end >= 0) field.setSelection(start.coerceAtMost(field.length()), end.coerceAtMost(field.length()))
  }
  fun reconcile(value: String, revision: Int) {
    val text = field.text ?: return
    if (revision != eventCount || BaseInputConnection.getComposingSpanStart(text) >= 0 || text.toString() == value) return
    val start = field.selectionStart.coerceAtLeast(0).coerceAtMost(value.length)
    val end = field.selectionEnd.coerceAtLeast(0).coerceAtMost(value.length)
    applying = true
    field.setText(value)
    field.setSelection(start, end)
    emittedText = value
    applying = false
  }
  fun focusField() {
    if (field.isEnabled && field.requestFocus()) {
      (context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).showSoftInput(field, InputMethodManager.SHOW_IMPLICIT)
    }
  }
  fun blurField() {
    (context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).hideSoftInputFromWindow(field.windowToken, 0)
    field.clearFocus()
  }
}

class NativeUIXTextFieldManager : SimpleViewManager<NativeUIXTextFieldView>(), NativeUIXTextFieldManagerInterface<NativeUIXTextFieldView> {
  private val delegate = NativeUIXTextFieldManagerDelegate(this)
  override fun getName() = "NativeUIXTextField"
  override fun getDelegate(): ViewManagerDelegate<NativeUIXTextFieldView> = delegate
  override fun createViewInstance(context: ThemedReactContext) = NativeUIXTextFieldView(context)
  override fun setVariant(view: NativeUIXTextFieldView, value: String?) = view.setVariant(value)
  override fun setValue(view: NativeUIXTextFieldView, value: String?) = view.setInitialValue(value.orEmpty())
  override fun setPlaceholder(view: NativeUIXTextFieldView, value: String?) = view.setPlaceholder(value)
  override fun setLabel(view: NativeUIXTextFieldView, value: String?) = view.setLabel(value)
  override fun setHelperText(view: NativeUIXTextFieldView, value: String?) = view.setHelperText(value)
  override fun setError(view: NativeUIXTextFieldView, value: String?) = view.setError(value)
  override fun setPasswordToggle(view: NativeUIXTextFieldView, value: Boolean) = view.setPasswordToggle(value)
  override fun setDisabled(view: NativeUIXTextFieldView, value: Boolean) = view.setDisabled(value)
  override fun setSecure(view: NativeUIXTextFieldView, value: Boolean) = view.setSecure(value)
  override fun reconcile(view: NativeUIXTextFieldView, value: String?, eventCount: Int) = view.reconcile(value.orEmpty(), eventCount)
  override fun focus(view: NativeUIXTextFieldView) = view.focusField()
  override fun blur(view: NativeUIXTextFieldView) = view.blurField()
  override fun receiveCommand(view: NativeUIXTextFieldView, commandId: String, args: ReadableArray?) {
    delegate.receiveCommand(view, commandId, args)
  }
}
