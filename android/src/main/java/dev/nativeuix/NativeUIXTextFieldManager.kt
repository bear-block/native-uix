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
  init {
    container.boxBackgroundMode = TextInputLayout.BOX_BACKGROUND_OUTLINE
    field.setSingleLine(true)
    field.imeOptions = EditorInfo.IME_ACTION_DONE
    container.addView(field, android.widget.LinearLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
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
  fun setPlaceholder(value: String?) { container.hint = value }
  fun setDisabled(disabled: Boolean) { container.isEnabled = !disabled; field.isEnabled = !disabled }
  fun setSecure(secure: Boolean) {
    if (this.secure == secure) return
    this.secure = secure
    field.inputType = android.text.InputType.TYPE_CLASS_TEXT or
      (if (secure) android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD else android.text.InputType.TYPE_TEXT_VARIATION_NORMAL)
    field.setSingleLine(true)
    // Single-line configuration replaces the transformation; apply masking last.
    field.transformationMethod = if (secure)
      android.text.method.PasswordTransformationMethod.getInstance() else null
    field.imeOptions = EditorInfo.IME_ACTION_DONE
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
  override fun setValue(view: NativeUIXTextFieldView, value: String?) = view.setInitialValue(value.orEmpty())
  override fun setPlaceholder(view: NativeUIXTextFieldView, value: String?) = view.setPlaceholder(value)
  override fun setDisabled(view: NativeUIXTextFieldView, value: Boolean) = view.setDisabled(value)
  override fun setSecure(view: NativeUIXTextFieldView, value: Boolean) = view.setSecure(value)
  override fun reconcile(view: NativeUIXTextFieldView, value: String?, eventCount: Int) = view.reconcile(value.orEmpty(), eventCount)
  override fun focus(view: NativeUIXTextFieldView) = view.focusField()
  override fun blur(view: NativeUIXTextFieldView) = view.blurField()
  override fun receiveCommand(view: NativeUIXTextFieldView, commandId: String, args: ReadableArray?) {
    delegate.receiveCommand(view, commandId, args)
  }
}
