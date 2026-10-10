package com.nativeuixexample

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "NativeUIXExample"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle = Bundle().apply {
          // Acceptance-only: hold the JS navigator while a second URL arrives.
          putInt("startupDelayMs", intent.getIntExtra("nativeuixStartupDelayMs", 0).coerceIn(0, 10000))
        }
      }

  override fun onNewIntent(intent: Intent) {
    // Linking.getInitialURL reads Activity.intent after JS subscribes. Keep the
    // latest URL even when React Native has no URL listener yet.
    setIntent(intent)
    super.onNewIntent(intent)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    applySystemBarAppearance(resources.configuration)
  }

  // The activity handles uiMode itself, so dark mode toggles arrive here.
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applySystemBarAppearance(newConfig)
  }

  /** Edge to edge: dark system bar icons on the light theme, light on dark. */
  private fun applySystemBarAppearance(configuration: Configuration) {
    val light =
        configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK != Configuration.UI_MODE_NIGHT_YES
    WindowCompat.getInsetsController(window, window.decorView).apply {
      isAppearanceLightStatusBars = light
      isAppearanceLightNavigationBars = light
    }
  }
}
