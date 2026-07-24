import XCTest
@testable import InversionesIOS

final class AppEnvironmentTests: XCTestCase {
    func testEnvironmentURLOverridesBundleURL() {
        let fallback = URL(string: "https://fallback.example/api/v1")!

        let result = AppEnvironment.resolveAPIBaseURL(
            environmentValue: "http://192.168.1.20:3000/api/v1",
            bundleValue: "https://production.example/api/v1",
            fallback: fallback
        )

        XCTAssertEqual(result.absoluteString, "http://192.168.1.20:3000/api/v1")
    }

    func testInvalidConfigurationUsesFallback() {
        let fallback = URL(string: "https://fallback.example/api/v1")!

        let result = AppEnvironment.resolveAPIBaseURL(
            environmentValue: nil,
            bundleValue: "",
            fallback: fallback
        )

        XCTAssertEqual(result, fallback)
    }
}
