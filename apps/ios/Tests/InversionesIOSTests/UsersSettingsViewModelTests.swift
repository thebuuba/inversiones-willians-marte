import XCTest
@testable import InversionesIOS

@MainActor
final class UsersSettingsViewModelTests: XCTestCase {
    func testLoadStoresUsers() async {
        let expected = SettingsUser(
            id: "user-2",
            name: "Cobrador",
            username: "collector",
            email: "collector@example.com",
            role: "COLLECTOR",
            active: true,
            createdAt: nil
        )
        let viewModel = UsersSettingsViewModel(
            accessToken: "token-123",
            loadUsers: { token in
                XCTAssertEqual(token, "token-123")
                return [expected]
            },
            createUser: { _, _ in expected },
            toggleUserActive: { _, _ in expected }
        )

        await viewModel.load()

        XCTAssertEqual(viewModel.users, [expected])
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testCreateAddsReturnedUserAndClearsForm() async {
        let created = SettingsUser(
            id: "user-2",
            name: "Cobrador",
            username: "collector",
            email: "collector@example.com",
            role: "COLLECTOR",
            active: true,
            createdAt: nil
        )
        let viewModel = UsersSettingsViewModel(
            accessToken: "token-123",
            loadUsers: { _ in [] },
            createUser: { token, input in
                XCTAssertEqual(token, "token-123")
                XCTAssertEqual(input.email, "collector@example.com")
                return created
            },
            toggleUserActive: { _, _ in created }
        )
        viewModel.name = "Cobrador"
        viewModel.username = "collector"
        viewModel.email = "collector@example.com"
        viewModel.password = "Secret12345"
        viewModel.role = "COLLECTOR"

        let didCreate = await viewModel.create()

        XCTAssertTrue(didCreate)
        XCTAssertEqual(viewModel.users, [created])
        XCTAssertEqual(viewModel.name, "")
        XCTAssertEqual(viewModel.email, "")
    }

    func testToggleReplacesExistingUser() async {
        let active = SettingsUser(id: "user-2", name: "Cobrador", username: nil, email: "collector@example.com", role: "COLLECTOR", active: true, createdAt: nil)
        let inactive = SettingsUser(id: "user-2", name: "Cobrador", username: nil, email: "collector@example.com", role: "COLLECTOR", active: false, createdAt: nil)
        let viewModel = UsersSettingsViewModel(
            accessToken: "token-123",
            loadUsers: { _ in [active] },
            createUser: { _, _ in active },
            toggleUserActive: { _, id in
                XCTAssertEqual(id, "user-2")
                return inactive
            }
        )
        await viewModel.load()

        await viewModel.toggleActive(active)

        XCTAssertEqual(viewModel.users, [inactive])
    }
}
