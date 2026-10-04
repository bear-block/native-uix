// The flexible app bars are experimental in Material 3 1.5 alpha (ADR-0007).
@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.material3.ExperimentalMaterial3ExpressiveApi::class)

package dev.nativeuix

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.only
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
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.drop

/** What the header shows for the route on top. */
internal data class StackHeaderModel(
  val routeKey: String,
  val title: String,
  val large: Boolean,
  val subtitle: String,
  val trailingLabel: String,
  val trailingDisabled: Boolean,
  val canGoBack: Boolean,
  /** The first route of a modal: a close button instead of Up. */
  val closes: Boolean = false,
  val search: Boolean = false,
  val searchPlaceholder: String = "",
)

/** Connects the Compose header to the View stack that feeds it scroll events. */
internal class StackHeaderBridge {
  /** Collapse state per route, so a route keeps its header when returned to. */
  val states = mutableMapOf<String, TopAppBarState>()
  var behavior: TopAppBarScrollBehavior? = null

  /** Moves the routes with the bar; set by the stack. */
  var follow: (() -> Unit)? = null

  /** Search text per route, kept while the route is on the stack. */
  val searchTexts = mutableMapOf<String, androidx.compose.foundation.text.input.TextFieldState>()
  var scope: CoroutineScope? = null

  /**
   * The stack does not start at the window's start edge (a navigation rail
   * is there), so the bar leaves the start inset (display cutout) to it.
   */
  val startInsetCovered = androidx.compose.runtime.mutableStateOf(false)

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
  onSearch: (type: String, text: String) -> Unit,
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
      // The search app bar does not collapse; scrolling must not move the
      // routes for a bar that is not shown.
      bridge.behavior = if (model.search) null else behavior
      bridge.scope = scope
    }
    val navigationIcon: @Composable () -> Unit = {
      if (model.closes) {
        IconButton(onClick = onBack) {
          Icon(
            androidx.compose.material.icons.Icons.Filled.Close,
            contentDescription = stringResource(R.string.native_uix_close),
          )
        }
      } else if (model.canGoBack) {
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
    val windowInsets = TopAppBarDefaults.windowInsets.let {
      if (bridge.startInsetCovered.value) {
        it.only(androidx.compose.foundation.layout.WindowInsetsSides.Top + androidx.compose.foundation.layout.WindowInsetsSides.End)
      } else {
        it
      }
    }
    if (model.search) {
      SearchHeader(model, bridge, navigationIcon, actions, onSearch, windowInsets)
    } else if (model.large) {
      LargeFlexibleTopAppBar(
        title = { Text(model.title) },
        subtitle = subtitle,
        navigationIcon = navigationIcon,
        actions = actions,
        scrollBehavior = behavior,
        windowInsets = windowInsets,
      )
    } else {
      TopAppBar(
        title = { Text(model.title) },
        subtitle = subtitle,
        navigationIcon = navigationIcon,
        actions = actions,
        scrollBehavior = behavior,
        windowInsets = windowInsets,
      )
    }
  }
}

/** Material 3 Expressive search app bar: the bar is the search field. */
@Composable
private fun SearchHeader(
  model: StackHeaderModel,
  bridge: StackHeaderBridge,
  navigationIcon: @Composable () -> Unit,
  actions: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit,
  onSearch: (type: String, text: String) -> Unit,
  windowInsets: androidx.compose.foundation.layout.WindowInsets,
) {
  val searchState = androidx.compose.material3.rememberSearchBarState()
  val text = bridge.searchTexts.getOrPut(model.routeKey) { androidx.compose.foundation.text.input.TextFieldState() }
  androidx.compose.runtime.LaunchedEffect(text) {
    androidx.compose.runtime.snapshotFlow { text.text.toString() }
      .drop(1)
      .collect { onSearch("change", it) }
  }
  androidx.compose.material3.AppBarWithSearch(
    state = searchState,
    inputField = {
      androidx.compose.material3.SearchBarDefaults.InputField(
        textFieldState = text,
        searchBarState = searchState,
        onSearch = { onSearch("submit", it) },
        placeholder = { if (model.searchPlaceholder.isNotEmpty()) Text(model.searchPlaceholder) },
        leadingIcon = { Icon(androidx.compose.material.icons.Icons.Filled.Search, contentDescription = null) },
        trailingIcon = {
          if (text.text.isNotEmpty()) {
            IconButton(onClick = {
              text.edit { replace(0, length, "") }
              onSearch("cancel", "")
            }) {
              Icon(
                androidx.compose.material.icons.Icons.Filled.Clear,
                contentDescription = stringResource(androidx.appcompat.R.string.abc_searchview_description_clear),
              )
            }
          }
        },
      )
    },
    navigationIcon = navigationIcon,
    actions = actions,
    windowInsets = windowInsets,
  )
}
