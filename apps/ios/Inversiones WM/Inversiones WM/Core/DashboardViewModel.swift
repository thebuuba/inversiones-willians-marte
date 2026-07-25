import Foundation
import Combine

@MainActor
public final class DashboardViewModel: ObservableObject {
    @Published public private(set) var dashboard: DashboardData?
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let accessToken: String
    private let service: DashboardService
    private let upcomingPaymentsService: UpcomingPaymentsService?
    @Published public private(set) var upcomingPayments: [UpcomingPayment] = []

    public init(
        accessToken: String,
        service: DashboardService,
        upcomingPaymentsService: UpcomingPaymentsService? = nil
    ) {
        self.accessToken = accessToken
        self.service = service
        self.upcomingPaymentsService = upcomingPaymentsService
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            dashboard = try await service.get(accessToken: accessToken)
            if let upcomingPaymentsService {
                upcomingPayments = (try? await upcomingPaymentsService.list(accessToken: accessToken)) ?? []
            }
        } catch {
            errorMessage = "No se pudo cargar el inicio"
        }
    }
}
