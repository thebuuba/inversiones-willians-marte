import XCTest
@testable import InversionesIOS

final class SettingsPanelModelTests: XCTestCase {
    func testBuildsAccountAndServerDetailsFromSession() {
        let model = SettingsPanelModel(
            session: AuthSession(
                accessToken: "token-123",
                user: User(
                    id: "u1",
                    name: "Admin Principal",
                    username: "admin",
                    email: "admin@example.com",
                    role: "ADMIN"
                )
            ),
            apiBaseURL: URL(string: "http://192.168.1.4:3000/api/v1")!
        )

        XCTAssertEqual(model.name, "Admin Principal")
        XCTAssertEqual(model.username, "admin")
        XCTAssertEqual(model.email, "admin@example.com")
        XCTAssertEqual(model.role, "Administrador")
        XCTAssertEqual(model.apiBaseURL, "http://192.168.1.4:3000/api/v1")
    }

    func testUsesFallbackUsernameAndReadableRole() {
        let model = SettingsPanelModel(
            session: AuthSession(
                accessToken: "token-123",
                user: User(
                    id: "u1",
                    name: "Cajera",
                    username: nil,
                    email: "cashier@example.com",
                    role: "CASHIER"
                )
            ),
            apiBaseURL: URL(string: "http://localhost:3000/api/v1")!
        )

        XCTAssertEqual(model.username, "Sin usuario")
        XCTAssertEqual(model.role, "Cajero")
    }
}
