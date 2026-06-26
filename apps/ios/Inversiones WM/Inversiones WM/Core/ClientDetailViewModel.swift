import Foundation
import Combine

@MainActor
public final class ClientDetailViewModel: ObservableObject {
    @Published public private(set) var detail: ClientDetail?
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let accessToken: String
    private let clientId: Int
    private let service: ClientsService

    public init(accessToken: String, clientId: Int, service: ClientsService) {
        self.accessToken = accessToken
        self.clientId = clientId
        self.service = service
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            detail = try await service.detail(accessToken: accessToken, id: clientId)
        } catch {
            errorMessage = "No se pudo cargar el cliente"
        }
    }

    public func update(_ input: CreateClientInput) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            _ = try await service.update(accessToken: accessToken, id: clientId, input: input)
            await load()
            return true
        } catch {
            errorMessage = "No se pudo actualizar el cliente"
            return false
        }
    }
}
