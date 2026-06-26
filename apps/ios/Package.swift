// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "InversionesIOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "InversionesIOS", targets: ["InversionesIOS"])
    ],
    targets: [
        .target(
            name: "InversionesIOS",
            path: "Inversiones WM/Inversiones WM/Core"
        ),
        .testTarget(name: "InversionesIOSTests", dependencies: ["InversionesIOS"])
    ]
)
