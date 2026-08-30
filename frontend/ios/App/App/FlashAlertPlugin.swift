import Foundation
import Capacitor
import AVFoundation
import AudioToolbox
import UIKit

@objc(FlashAlertPlugin)
public class FlashAlertPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FlashAlertPlugin"
    public let jsName = "FlashAlert"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "blink", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "vibrate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else {
            call.resolve(["available": false])
            return
        }
        call.resolve(["available": true])
    }

    @objc func vibrate(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            let generator = UINotificationFeedbackGenerator()
            generator.prepare()
            generator.notificationOccurred(.warning)
        }
        call.resolve(["success": true])
    }

    @objc func blink(_ call: CAPPluginCall) {
        let count = call.getInt("count") ?? 4
        let interval = call.getDouble("interval") ?? 0.15
        let withVibration = call.getBool("vibrate") ?? true

        // Kích hoạt rung mạnh ngay khi chuông báo bắt đầu
        if withVibration {
            DispatchQueue.main.async {
                AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
                let generator = UINotificationFeedbackGenerator()
                generator.prepare()
                generator.notificationOccurred(.warning)
            }
        }

        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else {
            call.resolve(["success": true, "reason": "No torch but vibrated"])
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            for i in 0..<count {
                do {
                    try device.lockForConfiguration()
                    device.torchMode = .on
                    device.unlockForConfiguration()
                    Thread.sleep(forTimeInterval: interval)

                    try device.lockForConfiguration()
                    device.torchMode = .off
                    device.unlockForConfiguration()
                    Thread.sleep(forTimeInterval: interval)

                    if withVibration && i % 2 == 1 {
                        DispatchQueue.main.async {
                            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
                        }
                    }
                } catch {
                    break
                }
            }
            call.resolve(["success": true])
        }
    }
}
