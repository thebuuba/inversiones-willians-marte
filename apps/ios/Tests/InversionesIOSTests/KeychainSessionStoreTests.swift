import XCTest
@testable import InversionesIOS

final class KeychainSessionStoreTests: XCTestCase {
    func testSaveLoadAndClearSession() throws {
        let store = KeychainSessionStore(service: "com.inversioneswilliansmarte.tests.\(UUID().uuidString)")
        let session = AuthSession(
            accessToken: "token-123",
            user: User(id: "u1", name: "Admin", username: "admin", email: "admin@example.com", role: "ADMIN")
        )

        try store.save(session)
        XCTAssertEqual(try store.load(), session)

        try store.clear()
        XCTAssertNil(try store.load())
    }
}
