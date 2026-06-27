import SwiftUI

public struct LoginView: View {
    @StateObject private var viewModel: LoginViewModel
    private let dashboardService: DashboardService
    private let clientsService: ClientsService
    private let loansService: LoansService
    private let upcomingPaymentsService: UpcomingPaymentsService
    private let requestsService: RequestsService

    public init(
        dashboardService: DashboardService,
        clientsService: ClientsService,
        loansService: LoansService,
        upcomingPaymentsService: UpcomingPaymentsService,
        requestsService: RequestsService,
        viewModel: @autoclosure @escaping () -> LoginViewModel
    ) {
        self.dashboardService = dashboardService
        self.clientsService = clientsService
        self.loansService = loansService
        self.upcomingPaymentsService = upcomingPaymentsService
        self.requestsService = requestsService
        _viewModel = StateObject(wrappedValue: viewModel())
    }

    public var body: some View {
        Group {
            if let session = viewModel.session {
                MainTabView(
                    userName: session.user.name,
                    accessToken: session.accessToken,
                    dashboardService: dashboardService,
                    clientsService: clientsService,
                    loansService: loansService,
                    upcomingPaymentsService: upcomingPaymentsService,
                    requestsService: requestsService
                ) {
                        try? viewModel.logout()
                }
            } else {
                VStack(spacing: 18) {
                    VStack(spacing: 6) {
                        Text("Inversiones Willians Marte")
                            .font(.title2.bold())
                        Text("Accede para continuar")
                            .foregroundStyle(.secondary)
                    }

                    TextField("Usuario", text: $viewModel.username)
                        .textFieldStyle(RoundedBorderTextFieldStyle())

                    SecureField("Clave", text: $viewModel.password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    Button {
                        Task { await viewModel.submit() }
                    } label: {
                        Text(viewModel.isLoading ? "Entrando..." : "Entrar")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.isLoading || viewModel.username.isEmpty || viewModel.password.isEmpty)
                }
                .padding(24)
            }
        }
    }
}
