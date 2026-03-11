// The flexible app bars are experimental in Material 3 1.5 alpha (ADR-0007).
@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.material3.ExperimentalMaterial3ExpressiveApi::class)

package dev.nativeuix

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeFlexibleTopAppBar
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.material3.TopAppBarState
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import kotlinx.coroutines.CoroutineScope

/** What the header shows for the route on top. */
internal data class StackHeaderModel(
  val routeKey: String,
  val title: String,
  val large: Boolean,
  val subtitle: String,
  val trailingLabel: String,
  val trailingDisabled: Boolean,
  val canGoBack: Boolean,
)

/** Connects the Compose header to the View stack that feeds it scroll events. */
internal class StackHeaderBridge {
  /** Collapse state per route, so a route keeps its header when returned to. */
  val states = mutableMapOf<String, TopAppBarState>()
  var behavior: TopAppBarScrollBehavior? = null
  var scope: CoroutineScope? = null

  fun stateFor(routeKey: String): TopAppBarState =
    states.getOrPut(routeKey) { TopAppBarState(-Float.MAX_VALUE, 0f, 0f) }
}

/**
 * Material 3 Expressive app bar: large flexible (collapses with the route's
 * scrolling) or small, with subtitle, Up button and a trailing text action.
 */
@Composable
internal fun StackHeader(
  model: StackHeaderModel,
  bridge: StackHeaderBridge,
  onBack: () -> Unit,
  onTrailing: () -> Unit,
) {
  val context = LocalContext.current
  val dark = isSystemInDarkTheme()
  val colors = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    dark -> darkColorScheme()
    else -> lightColorScheme()
  }
  MaterialExpressiveTheme(colorScheme = colors) {
    val state = bridge.stateFor(model.routeKey)
    val behavior = if (model.large) {
      TopAppBarDefaults.exitUntilCollapsedScrollBehavior(state)
    } else {
      TopAppBarDefaults.pinnedScrollBehavior(state)
    }
    val scope = rememberCoroutineScope()
    SideEffect {
      bridge.behavior = behavior
      bridge.scope = scope
    }
    val navigationIcon: @Composable () -> Unit = {
      if (model.canGoBack) {
        IconButton(onClick = onBack) {
          Icon(
            painter = painterResource(androidx.appcompat.R.drawable.abc_ic_ab_back_material),
            contentDescription = stringResource(androidx.appcompat.R.string.abc_action_bar_up_description),
          )
        }
      }
    }
    val actions: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit = {
      if (model.trailingLabel.isNotEmpty()) {
        TextButton(onClick = onTrailing, enabled = !model.trailingDisabled) { Text(model.trailingLabel) }
      }
    }
    val subtitle: @Composable () -> Unit = { if (model.subtitle.isNotEmpty()) Text(model.subtitle) }
    if (model.large) {
      LargeFlexibleTopAppBar(
        title = { Text(model.title) },
        subtitle = subtitle,
        navigationIcon = navigationIcon,
        actions = actions,
        scrollBehavior = behavior,
      )
    } else {
      TopAppBar(
        title = { Text(model.title) },
        subtitle = subtitle,
        navigationIcon = navigationIcon,
        actions = actions,
        scrollBehavior = behavior,
      )
    }
  }
}
