import Foundation
import Combine

public struct AuditActor: Decodable, Equatable {
    public let id: String?
    public let name: String?
}

public struct SecurityAuditEvent: Decodable, Equatable, Identifiable {
    public let id: String
    public let action: String
    public let entityType: String?
    public let entityId: String?
    public let createdAt: String
    public let user: AuditActor?

    public var actorName: String {
        user?.name ?? "Sistema"
    }
}

public struct SecuritySettingsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func profile(accessToken: String) async throws -> User {
        let request = try APIClient.profileRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<User>.self, from: data)
        guard let user = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return user
    }

    public func audit(accessToken: String) async throws -> [SecurityAuditEvent] {
        let request = try APIClient.auditRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<[SecurityAuditEvent]>.self, from: data)
        return wrapped.data ?? []
    }
}

@MainActor
public final class SecuritySettingsViewModel: ObservableObject {
    public typealias ProfileAction = (String) async throws -> User
    public typealias AuditAction = (String) async throws -> [SecurityAuditEvent]

    @Published public private(set) var profile: User?
    @Published public private(set) var events: [SecurityAuditEvent] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let accessToken: String
    private let profileAction: ProfileAction
    private let auditAction: AuditAction

    public convenience init(accessToken: String, service: SecuritySettingsService) {
        self.init(
            accessToken: accessToken,
            profile: { try await service.profile(accessToken: $0) },
            audit: { try await service.audit(accessToken: $0) }
        )
    }

    public init(accessToken: String, profile: @escaping ProfileAction, audit: @escaping AuditAction) {
        self.accessToken = accessToken
        profileAction = profile
        auditAction = audit
    }

    public func load(includeAudit: Bool = true) async {
        isLoading = true
        errorMessage = nil
        do {
            profile = try await profileAction(accessToken)
            events = includeAudit ? try await auditAction(accessToken) : []
        } catch {
            errorMessage = "No se pudo cargar seguridad"
        }
        isLoading = false
    }
}
