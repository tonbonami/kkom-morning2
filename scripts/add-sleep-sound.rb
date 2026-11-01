# 잠 소리(SleepSound.swift + 실제 빗소리 rain-roof.m4a·rain-window.m4a)를 App 타깃에 등록. 이미 있으면 건너뜀.
#   처음 합성 빗소리(rain.caf)는 빼고 지운다(우댕 「너무 인공적」 2026-11-02 → 실제 녹음).
#   실행: ruby -E UTF-8 scripts/add-sleep-sound.rb
require 'xcodeproj'
p = Xcodeproj::Project.open('ios/App/App.xcodeproj')
app = p.targets.find { |t| t.name == 'App' } or abort 'App 타깃 못 찾음'
group = p.main_group.find_subpath('App', false) or abort 'App 그룹 못 찾음'
def ref(group, name) = group.files.find { |f| f.path == name } || group.new_reference(name)
swift = ref(group, 'SleepSound.swift')
app.add_file_references([swift]) unless app.source_build_phase.files_references.include?(swift)
%w[rain-roof.m4a rain-window.m4a].each do |n|
  r = ref(group, n)
  app.add_resources([r]) unless app.resources_build_phase.files_references.include?(r)
end
if (old = group.files.find { |f| f.path == 'rain.caf' })
  app.resources_build_phase.remove_file_reference(old)
  old.remove_from_project
end
p.save
puts 'ok'
