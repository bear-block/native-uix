# Adds the regression target to an isolated packed consumer, never to the library.
require 'fileutils'
require 'xcodeproj'

abort 'Usage: ruby prepare-ios-ui-tests.rb /absolute/path/to/consumer/ios' unless ARGV.length == 1
ios = File.expand_path(ARGV.fetch(0))
project_path = File.join(ios, 'NUXConsumer.xcodeproj')
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |target| target.name == 'NUXConsumer' }
abort 'Expected the NUXConsumer application target' unless app
name = 'NativeUIXPackedUITests'
target = project.targets.find { |item| item.name == name }
unless target
  target = project.new_target(:ui_test_bundle, name, :ios, '18.0')
  target.add_dependency(app)
end
folder = File.join(ios, name)
FileUtils.mkdir_p(folder)
FileUtils.cp(File.join(__dir__, 'NavigationUITests.swift'), folder)
group = project.main_group.find_subpath(name, true)
group.set_source_tree('<group>')
group.set_path(name)
reference = group.files.find { |file| file.path == 'NavigationUITests.swift' } ||
  group.new_file('NavigationUITests.swift')
unless target.source_build_phase.files_references.include?(reference)
  target.source_build_phase.add_file_reference(reference)
end
target.build_configurations.each do |configuration|
  configuration.build_settings.merge!({
    'PRODUCT_NAME' => '$(TARGET_NAME)',
    'PRODUCT_BUNDLE_IDENTIFIER' => 'org.bearblock.nativeuix.packed-uitests',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'SWIFT_VERSION' => '5.0',
    'TEST_TARGET_NAME' => app.name,
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'CODE_SIGNING_ALLOWED' => 'NO'
  })
end
# Adopt scenes in the generated RN host, independent of the library checkout.
# Keep this fixture pinned to the NUXConsumer template shape.
delegate_path = File.join(ios, 'NUXConsumer', 'AppDelegate.swift')
delegate = File.read(delegate_path)
unless delegate.include?('class SceneDelegate:')
  start = delegate.index('    window = UIWindow(frame: UIScreen.main.bounds)')
  finish = delegate.index('    return true', start || 0)
  abort 'Unexpected RN AppDelegate template; review scene integration' unless start && finish
  delegate[start...finish] = ''
  boundary = "\n}\n\nclass ReactNativeDelegate"
  abort 'Missing AppDelegate class boundary' unless delegate.include?(boundary)
  configuration = <<~SWIFT

    func application(_ application: UIApplication,
      configurationForConnecting connectingSceneSession: UISceneSession,
      options: UIScene.ConnectionOptions) -> UISceneConfiguration {
      let configuration = UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
      configuration.delegateClass = SceneDelegate.self
      return configuration
    }
  SWIFT
  delegate.sub!(boundary, "\n#{configuration}#{boundary}")
  delegate += <<~SWIFT

    class SceneDelegate: UIResponder, UIWindowSceneDelegate {
      var window: UIWindow?
      func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene,
          let app = UIApplication.shared.delegate as? AppDelegate,
          let factory = app.reactNativeFactory else { return }
        window = UIWindow(windowScene: scene)
        factory.startReactNative(withModuleName: "NUXConsumer", in: window, launchOptions: nil)
      }
    }
  SWIFT
  File.write(delegate_path, delegate)
end
plist_path = File.join(ios, 'NUXConsumer', 'Info.plist')
plist = Xcodeproj::Plist.read_from_path(plist_path)
plist['UIApplicationSceneManifest'] = {
  'UIApplicationSupportsMultipleScenes' => false,
  'UISceneConfigurations' => {}
}
Xcodeproj::Plist.write_to_path(plist, plist_path)
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.set_launch_target(app)
scheme.test_action.build_configuration = 'Release'
scheme.save_as(project_path, name, true)
puts "Prepared #{name} in #{project_path}"
