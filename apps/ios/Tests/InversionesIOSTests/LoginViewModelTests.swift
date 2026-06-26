import XCTest
@testable import InversionesIOS

@MainActor
final class LoginViewModelTests: XCTestCase {
    private final class MemorySessionStore: SessionStore {
        var session: AuthSession?

        func save(_ session: AuthSession) throws {
            self.session = session
        }

        func load() throws -> AuthSession? {
            session
        }

        func clear() throws {
            session = nil
        }
    }

    func testSubmitStoresSessionOnSuccessfulLogin() async {
        let expected = AuthSession(
            accessToken: "token-123",
            user: User(id: "u1", name: "Admin", username: "admin", email: "admin@example.com", role: "ADMIN")
        )
        let store = MemorySessionStore()
        let viewModel = LoginViewModel(sessionStore: store) { username, password in
            XCTAssertEqual(username, "admin")
            XCTAssertEqual(password, "secret")
            return expected
        }

        viewModel.username = "admin"
        viewModel.password = "secret"

        await viewModel.submit()

        XCTAssertEqual(viewModel.session, expected)
        XCTAssertEqual(store.session, expected)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testLoadsStoredSessionAndClearsOnLogout() throws {
        let expected = AuthSession(
            accessToken: "token-123",
            user: User(id: "u1", name: "Admin", username: "admin", email: "admin@example.com", role: "ADMIN")
        )
        let store = MemorySessionStore()
        store.session = expected

        let viewModel = LoginViewModel(sessionStore: store) { _, _ in
            XCTFail("login should not run")
            return expected
        }

        XCTAssertEqual(viewModel.session, expected)

        try viewModel.logout()

        XCTAssertNil(viewModel.session)
        XCTAssertNil(store.session)
    }
}
