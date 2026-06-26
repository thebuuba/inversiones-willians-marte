import Foundation
import Combine

@MainActor
public final class DashboardViewModel: ObservableObject {
    @Published public private(set) var dashboard: DashboardData?
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let accessToken: String
    private let service: DashboardService

    public init(accessToken: String, service: DashboardService) {
        self.accessToken = accessToken
        self.service = service
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            dashboard = try await service.get(accessToken: accessToken)
        } catch {
            errorMessage = "No se pudo cargar el inicio"
        }
    }
}
