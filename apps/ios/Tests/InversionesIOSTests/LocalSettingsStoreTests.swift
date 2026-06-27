import XCTest
@testable import InversionesIOS

final class LocalSettingsStoreTests: XCTestCase {
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        defaults = UserDefaults(suiteName: "LocalSettingsStoreTests")!
        defaults.removePersistentDomain(forName: "LocalSettingsStoreTests")
    }

    func testLoadsDefaultSettings() {
        let store = LocalSettingsStore(defaults: defaults)

        let settings = store.load()

        XCTAssertEqual(settings.businessName, "Inversiones Willians Marte")
        XCTAssertEqual(settings.currencyCode, "DOP")
        XCTAssertEqual(settings.localeIdentifier, "es_DO")
        XCTAssertTrue(settings.paymentRemindersEnabled)
        XCTAssertFalse(settings.dailySummaryEnabled)
    }

    func testSavesSettings() {
        let store = LocalSettingsStore(defaults: defaults)
        let expected = LocalSettings(
            businessName: "WM Capital",
            contactEmail: "admin@example.com",
            phone: "809-555-0000",
            address: "Santo Domingo",
            currencyCode: "USD",
            localeIdentifier: "en_US",
            paymentRemindersEnabled: false,
            dailySummaryEnabled: true,
            reminderDaysBefore: 2,
            dailySummaryTime: "08:30"
        )

        store.save(expected)

        XCTAssertEqual(store.load(), expected)
    }
}
