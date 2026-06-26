import Foundation

public struct ClientsService: Sendable {
    public let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func list(accessToken: String, take: Int = 50, skip: Int = 0) async throws -> ClientsPage {
        let request = try APIClient.clientsRequest(
            baseURL: baseURL,
            accessToken: accessToken,
            take: take,
            skip: skip
        )
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<ClientsPage>.self, from: data)
        return wrapped.data ?? ClientsPage(data: [], total: 0)
    }

    public func create(accessToken: String, input: CreateClientInput) async throws -> Client {
        let request = try APIClient.createClientRequest(
            baseURL: baseURL,
            accessToken: accessToken,
            input: input
        )
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<Client>.self, from: data)
        guard let client = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return client
    }

    public func detail(accessToken: String, id: Int) async throws -> ClientDetail {
        let request = try APIClient.clientDetailRequest(baseURL: baseURL, accessToken: accessToken, id: id)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<ClientDetail>.self, from: data)
        guard let detail = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return detail
    }

    public func update(accessToken: String, id: Int, input: CreateClientInput) async throws -> Client {
        let request = try APIClient.updateClientRequest(
            baseURL: baseURL,
            accessToken: accessToken,
            id: id,
            input: input
        )
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<Client>.self, from: data)
        guard let client = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return client
    }
}
