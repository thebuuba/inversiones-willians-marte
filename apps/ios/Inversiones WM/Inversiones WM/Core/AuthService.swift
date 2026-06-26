import Foundation

public struct AuthService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func login(username: String, password: String) async throws -> AuthSession {
        let request = try APIClient.loginRequest(baseURL: baseURL, username: username, password: password)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<AuthSession>.self, from: data)
        guard wrapped.success, let auth = wrapped.data else {
            throw URLError(.userAuthenticationRequired)
        }

        return auth
    }
}
