import Foundation

public struct LoansService: Sendable {
    public let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func list(accessToken: String, take: Int = 50, skip: Int = 0) async throws -> LoansPage {
        let request = try APIClient.loansRequest(
            baseURL: baseURL,
            accessToken: accessToken,
            take: take,
            skip: skip
        )
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<LoansPage>.self, from: data)
        return wrapped.data ?? LoansPage(data: [], total: 0)
    }

    public func create(accessToken: String, input: CreateLoanInput) async throws -> Loan {
        let request = try APIClient.createLoanRequest(baseURL: baseURL, accessToken: accessToken, input: input)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<Loan>.self, from: data)
        guard let loan = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return loan
    }

    public func detail(accessToken: String, id: String) async throws -> LoanDetail {
        let request = try APIClient.loanDetailRequest(baseURL: baseURL, accessToken: accessToken, id: id)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<LoanDetail>.self, from: data)
        guard let detail = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return detail
    }
}
