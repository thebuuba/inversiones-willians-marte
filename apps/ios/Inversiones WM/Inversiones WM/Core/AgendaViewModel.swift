import Foundation
import Combine

@MainActor
public final class AgendaViewModel: ObservableObject {
    @Published public private(set) var payments: [UpcomingPayment] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let accessToken: String
    private let service: UpcomingPaymentsService

    public init(accessToken: String, service: UpcomingPaymentsService) {
        self.accessToken = accessToken
        self.service = service
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            payments = try await service.list(accessToken: accessToken)
        } catch {
            errorMessage = "No se pudo cargar la agenda"
        }
    }
}
