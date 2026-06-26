import Foundation

public struct PaymentsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func create(accessToken: String, input: CreatePaymentInput) async throws -> PaymentRecord {
        let request = try APIClient.createPaymentRequest(baseURL: baseURL, accessToken: accessToken, input: input)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<PaymentRecord>.self, from: data)
        guard let payment = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return payment
    }
}
