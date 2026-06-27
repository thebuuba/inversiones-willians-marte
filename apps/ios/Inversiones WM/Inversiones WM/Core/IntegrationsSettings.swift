import Foundation
import Combine

public struct BackendHealthStatus: Decodable, Equatable, Sendable {
    public let status: String
    public let service: String
}

public struct IntegrationsSettingsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func health() async throws -> BackendHealthStatus {
        let request = try APIClient.healthRequest(baseURL: baseURL)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<BackendHealthStatus>.self, from: data)
        guard let status = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return status
    }
}

@MainActor
public final class IntegrationsSettingsViewModel: ObservableObject {
    @Published public private(set) var status: BackendHealthStatus?
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let healthAction: () async throws -> BackendHealthStatus

    public convenience init(service: IntegrationsSettingsService) {
        self.init {
            try await service.health()
        }
    }

    public init(health: @escaping () async throws -> BackendHealthStatus) {
        healthAction = health
    }

    public func refresh() async {
        isLoading = true
        errorMessage = nil
        do {
            status = try await healthAction()
        } catch {
            errorMessage = "No se pudo conectar con el backend"
        }
        isLoading = false
    }
}
