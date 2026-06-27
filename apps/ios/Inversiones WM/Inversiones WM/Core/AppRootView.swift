import SwiftUI

public struct AppRootView: View {
    private let authService: AuthService
    private let dashboardService: DashboardService
    private let clientsService: ClientsService
    private let loansService: LoansService
    private let upcomingPaymentsService: UpcomingPaymentsService
    private let requestsService: RequestsService
    private let sessionStore: SessionStore

    public init(apiBaseURL: URL) {
        authService = AuthService(baseURL: apiBaseURL)
        dashboardService = DashboardService(baseURL: apiBaseURL)
        clientsService = ClientsService(baseURL: apiBaseURL)
        loansService = LoansService(baseURL: apiBaseURL)
        upcomingPaymentsService = UpcomingPaymentsService(baseURL: apiBaseURL)
        requestsService = RequestsService(baseURL: apiBaseURL)
        sessionStore = KeychainSessionStore()
    }

    public var body: some View {
        LoginView(
            dashboardService: dashboardService,
            clientsService: clientsService,
            loansService: loansService,
            upcomingPaymentsService: upcomingPaymentsService,
            requestsService: requestsService,
            viewModel: LoginViewModel(sessionStore: sessionStore) { username, password in
                try await authService.login(username: username, password: password)
            }
        )
    }
}
