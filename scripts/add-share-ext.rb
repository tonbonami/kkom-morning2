# KkomShare(공유 확장) 타깃을 App.xcodeproj에 안전하게 추가.
#   실행: ruby -E UTF-8 scripts/add-share-ext.rb
#   기존 KkomNotifyService 확장 설정을 미러링 + App Group 엔타이틀먼트.
require 'xcodeproj'

PROJ = 'ios/App/App.xcodeproj'
TEAM = 'JDDK6B2EKF'
BUNDLE = 'com.tonbonami.kkommorning.KkomShare'

p = Xcodeproj::Project.open(PROJ)

if p.targets.any? { |t| t.name == 'KkomShare' }
  puts 'KkomShare 이미 존재 — 스킵'; exit 0
end

app = p.targets.find { |t| t.name == 'App' } or abort 'App 타깃 못 찾음'

# 1) 타깃(app extension, iOS 16.0)
target = p.new_target(:app_extension, 'KkomShare', :ios, '16.0')

# 2) 그룹 + 파일 참조
group = p.main_group.find_subpath('KkomShare', true)
group.set_source_tree('SOURCE_ROOT')
group.set_path('KkomShare')
swift = group.new_reference('ShareViewController.swift')
group.new_reference('Info.plist')
group.new_reference('KkomShare.entitlements')
target.add_file_references([swift])   # 컴파일되는 소스만

# 3) 빌드 설정 (Debug/Release 둘 다) — NotifyService 미러 + 엔타이틀먼트
target.build_configurations.each do |c|
  bs = c.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER']        = BUNDLE
  bs['PRODUCT_NAME']                     = '$(TARGET_NAME)'
  bs['INFOPLIST_FILE']                   = 'KkomShare/Info.plist'
  bs['GENERATE_INFOPLIST_FILE']          = 'YES'
  bs['INFOPLIST_KEY_CFBundleDisplayName']= '꼼모닝'
  bs['CODE_SIGN_ENTITLEMENTS']           = 'KkomShare/KkomShare.entitlements'
  bs['CODE_SIGN_STYLE']                  = 'Automatic'
  bs['DEVELOPMENT_TEAM']                 = TEAM
  bs['IPHONEOS_DEPLOYMENT_TARGET']       = '16.0'
  bs['SWIFT_VERSION']                    = '5.0'
  bs['MARKETING_VERSION']                = '1.0'
  bs['CURRENT_PROJECT_VERSION']          = '48'
  bs['SKIP_INSTALL']                     = 'YES'
  bs['TARGETED_DEVICE_FAMILY']           = '1,2'
  bs['SWIFT_EMIT_LOC_STRINGS']           = 'YES'
end

# 4) App 의존성 + '.appex'를 기존 확장 임베드 페이즈에 추가
app.add_dependency(target)
embed = app.copy_files_build_phases.find { |ph| ph.display_name == 'Embed Foundation Extensions' } \
        || app.copy_files_build_phases.find { |ph| ph.symbol_dst_subfolder_spec == :plug_ins }
abort '임베드 페이즈 못 찾음' unless embed
bf = embed.add_file_reference(target.product_reference)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

p.save
puts 'KkomShare 타깃 추가 완료'
puts '  targets: ' + p.targets.map(&:name).inspect
puts '  embed:   ' + embed.files.map(&:display_name).inspect
puts '  app deps:' + app.dependencies.map { |d| d.target&.name }.inspect
