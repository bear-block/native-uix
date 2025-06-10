require 'json'

# Native UIX supports the New Architecture only (Fabric, custom C++ shadow nodes).
if ENV['RCT_NEW_ARCH_ENABLED'] == '0'
  raise '@bear-block/native-uix requires the React Native New Architecture (RCT_NEW_ARCH_ENABLED=1).'
end

Pod::Spec.new do |s|
  s.name         = 'native-uix'
  s.version      = JSON.parse(File.read(File.join(__dir__, 'package.json')))['version'].split('-').first
  s.summary      = 'Experimental native-adaptive UI components for React Native.'
  s.homepage     = 'https://github.com/bear-block/native-uix'
  s.license      = { :type => 'MIT', :file => 'LICENSE' }
  s.author       = { 'Bear Block' => 'opensource@bear-block.com' }
  s.source       = { :git => 'https://github.com/bear-block/native-uix.git', :tag => s.version.to_s }
  s.source_files = 'ios/**/*.{h,m,mm,swift}', 'common/cpp/**/*.{h,cpp}'
  s.pod_target_xcconfig = { 'HEADER_SEARCH_PATHS' => '"$(PODS_TARGET_SRCROOT)/common/cpp"' }
  s.platform     = :ios, '15.1'
  s.swift_version = '6.0'

  # React Native installs Codegen and Fabric dependencies for this pod.
  install_modules_dependencies(s)
end
