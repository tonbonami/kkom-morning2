#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Capacitor에 Canvas 플러그인 등록 (open 메서드). 앱 내장 플러그인 등록의 표준 방식.
CAP_PLUGIN(CanvasPlugin, "Canvas",
  CAP_PLUGIN_METHOD(open, CAPPluginReturnPromise);
)
