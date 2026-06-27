import Foundation
import Combine

public struct CreateUserInput: Encodable, Equatable, Sendable {
    public let name: String
    public let username: String?
    public let email: String
    public let password: String
    public let role: String

    public init(name: String, username: String? = nil, email: String, password: String, role: String) {
        self.name = name
        self.username = username
        self.email = email
        self.password = password
        self.role = role
    }
}

public struct SettingsUser: Decodable, Equatable, Identifiable {
    public let id: String
    public let name: String
    public let username: String?
    public let email: String
    public let role: String
    public let active: Bool
    public let createdAt: String?

    public var roleLabel: String {
        switch role {
        case "ADMIN": "Administrador"
        case "CASHIER": "Cajero"
        case "COLLECTOR": "Cobrador"
        default: role
        }
    }
}

public struct UsersSettingsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func list(accessToken: String) async throws -> [SettingsUser] {
        let request = try APIClient.usersRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<[SettingsUser]>.self, from: data)
        return wrapped.data ?? []
    }

    public func create(accessToken: String, input: CreateUserInput) async throws -> SettingsUser {
        let request = try APIClient.createUserRequest(baseURL: baseURL, accessToken: accessToken, input: input)
        return try await sendMutation(request)
    }

    public func toggleActive(accessToken: String, id: String) async throws -> SettingsUser {
        let request = try APIClient.toggleUserActiveRequest(baseURL: baseURL, accessToken: accessToken, id: id)
        return try await sendMutation(request)
    }

    private func sendMutation(_ request: URLRequest) async throws -> SettingsUser {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<SettingsUser>.self, from: data)
        guard let user = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return user
    }
}

@MainActor
public final class UsersSettingsViewModel: ObservableObject {
    public typealias LoadUsersAction = (String) async throws -> [SettingsUser]
    public typealias CreateUserAction = (String, CreateUserInput) async throws -> SettingsUser
    public typealias ToggleUserActiveAction = (String, String) async throws -> SettingsUser

    @Published public private(set) var users: [SettingsUser] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var isSaving = false
    @Published public private(set) var errorMessage: String?
    @Published public var name = ""
    @Published public var username = ""
    @Published public var email = ""
    @Published public var password = ""
    @Published public var role = "COLLECTOR"

    private let accessToken: String
    private let loadUsersAction: LoadUsersAction
    private let createUserAction: CreateUserAction
    private let toggleUserActiveAction: ToggleUserActiveAction

    public convenience init(accessToken: String, service: UsersSettingsService) {
        self.init(
            accessToken: accessToken,
            loadUsers: { try await service.list(accessToken: $0) },
            createUser: { try await service.create(accessToken: $0, input: $1) },
            toggleUserActive: { try await service.toggleActive(accessToken: $0, id: $1) }
        )
    }

    public init(
        accessToken: String,
        loadUsers: @escaping LoadUsersAction,
        createUser: @escaping CreateUserAction,
        toggleUserActive: @escaping ToggleUserActiveAction
    ) {
        self.accessToken = accessToken
        loadUsersAction = loadUsers
        createUserAction = createUser
        toggleUserActiveAction = toggleUserActive
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        do {
            users = try await loadUsersAction(accessToken)
        } catch {
            errorMessage = "No se pudieron cargar los usuarios"
        }
        isLoading = false
    }

    public func create() async -> Bool {
        isSaving = true
        errorMessage = nil
        do {
            let input = CreateUserInput(
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                username: emptyToNil(username),
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                role: role
            )
            let created = try await createUserAction(accessToken, input)
            users.insert(created, at: 0)
            clearForm()
            isSaving = false
            return true
        } catch {
            errorMessage = "No se pudo crear el usuario"
            isSaving = false
            return false
        }
    }

    public func toggleActive(_ user: SettingsUser) async {
        errorMessage = nil
        do {
            let updated = try await toggleUserActiveAction(accessToken, user.id)
            users = users.map { $0.id == updated.id ? updated : $0 }
        } catch {
            errorMessage = "No se pudo actualizar el usuario"
        }
    }

    private func clearForm() {
        name = ""
        username = ""
        email = ""
        password = ""
        role = "COLLECTOR"
    }

    private func emptyToNil(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
