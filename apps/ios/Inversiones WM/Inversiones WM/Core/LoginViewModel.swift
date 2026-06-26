import Foundation
import Combine

@MainActor
public final class LoginViewModel: ObservableObject {
    public typealias LoginAction = (String, String) async throws -> AuthSession

    @Published public var username = ""
    @Published public var password = ""
    @Published public private(set) var errorMessage: String?
    @Published public private(set) var isLoading = false
    @Published public private(set) var session: AuthSession?

    private let loginAction: LoginAction
    private let sessionStore: SessionStore?

    public init(sessionStore: SessionStore? = nil, loginAction: @escaping LoginAction) {
        self.sessionStore = sessionStore
        self.loginAction = loginAction
        session = try? sessionStore?.load()
    }

    public func submit() async {
        isLoading = true
        errorMessage = nil

        do {
            let nextSession = try await loginAction(username, password)
            try sessionStore?.save(nextSession)
            session = nextSession
        } catch {
            errorMessage = "No se pudo iniciar sesion"
        }

        isLoading = false
    }

    public func logout() throws {
        try sessionStore?.clear()
        session = nil
    }
}
