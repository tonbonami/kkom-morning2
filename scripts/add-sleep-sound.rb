# 잠 소리(SleepSound.swift + rain.caf)를 App 타깃에 등록. 이미 있으면 건너뜀.
#   실행: ruby -E UTF-8 scripts/add-sleep-sound.rb
require 'xcodeproj'
p = Xcodeproj::Project.open('ios/App/App.xcodeproj')
app = p.targets.find { |t| t.name == 'App' } or abort 'App 타깃 못 찾음'
group = p.main_group.find_subpath('App', false) or abort 'App 그룹 못 찾음'
def ref(group, name) = group.files.find { |f| f.path == name } || group.new_reference(name)
swift = ref(group, 'SleepSound.swift')
app.add_file_references([swift]) unless app.source_build_phase.files_references.include?(swift)
caf = ref(group, 'rain.caf')
app.add_resources([caf]) unless app.resources_build_phase.files_references.include?(caf)
p.save
puts 'ok'
