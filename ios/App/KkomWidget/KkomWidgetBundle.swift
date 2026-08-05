//
//  KkomWidgetBundle.swift
//  KkomWidget
//
//  Created by mydang on 7/31/26.
//

import WidgetKit
import SwiftUI

@main
struct KkomWidgetBundle: WidgetBundle {
    var body: some Widget {
        KkomWidget()
        if #available(iOS 16.2, *) { KkomLiveActivity() }
    }
}
