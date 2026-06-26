import Foundation

public struct UpcomingPaymentsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func list(accessToken: String) async throws -> [UpcomingPayment] {
        let request = try APIClient.upcomingPaymentsRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<[UpcomingPayment]>.self, from: data)
        return wrapped.data ?? []
    }
}
