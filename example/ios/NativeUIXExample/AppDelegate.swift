import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }
}

// iOS 27 requires the UIScene lifecycle; React Native starts in the scene's window.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    let launchOptions: [UIApplication.LaunchOptionsKey: Any]? =
      connectionOptions.urlContexts.first.map { [.url: $0.url] }
    if let url = connectionOptions.urlContexts.first?.url {
      NativeUIXExampleLinks.receive(url)
    }
    let delay = max(0, min(10000, UserDefaults.standard.integer(forKey: "NativeUIXStartupDelayMs")))
    factory.startReactNative(withModuleName: "NativeUIXExample", in: window,
                            initialProperties: ["startupDelayMs": delay], launchOptions: launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      NativeUIXExampleLinks.receive(context.url)
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

// App-owned startup inbox: one consumer, latest URL wins before JS is ready.
@objc(NativeUIXExampleLinks)
class NativeUIXExampleLinks: RCTEventEmitter {
  private static var pendingURL: String?
  private static weak var emitter: NativeUIXExampleLinks?
  private var ready = false

  override init() {
    super.init()
    Self.emitter = self
  }

  @objc override static func requiresMainQueueSetup() -> Bool { true }
  override var methodQueue: DispatchQueue! { DispatchQueue.main }
  override func supportedEvents() -> [String]! { ["url"] }
  override func stopObserving() { ready = false }

  static func receive(_ url: URL) {
    if let emitter = emitter, emitter.ready {
      emitter.sendEvent(withName: "url", body: ["url": url.absoluteString])
    } else {
      pendingURL = url.absoluteString
    }
  }

  @objc(consumeInitialURL:reject:)
  func consumeInitialURL(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // JS subscribes before calling this. Main-queue serialization closes the
    // gap between consuming the pending URL and starting live delivery.
    ready = true
    let url = Self.pendingURL
    Self.pendingURL = nil
    resolve(url)
  }
}
