import Foundation
import Capacitor
import AVFoundation

@objc(FlashAlertPlugin)
public class FlashAlertPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FlashAlertPlugin"
    public let jsName = "FlashAlert"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "blink", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else {
            call.resolve(["available": false])
            return
        }
        call.resolve(["available": true])
    }

    @objc func blink(_ call: CAPPluginCall) {
        let count = call.getInt("count") ?? 4
        let interval = call.getDouble("interval") ?? 0.15

        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else {
            call.resolve(["success": false, "reason": "No torch available"])
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            for _ in 0..<count {
                do {
                    try device.lockForConfiguration()
                    device.torchMode = .on
                    device.unlockForConfiguration()
                    Thread.sleep(forTimeInterval: interval)

                    try device.lockForConfiguration()
                    device.torchMode = .off
                    device.unlockForConfiguration()
                    Thread.sleep(forTimeInterval: interval)
                } catch {
                    break
                }
            }
            call.resolve(["success": true])
        }
    }
}
