import Foundation

public struct DashboardService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func get(accessToken: String) async throws -> DashboardData {
        let request = try APIClient.dashboardRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<DashboardData>.self, from: data)
        guard let dashboard = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return dashboard
    }
}
