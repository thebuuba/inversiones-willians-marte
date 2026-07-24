import SwiftUI

public struct LoginView: View {
    @StateObject private var viewModel: LoginViewModel
    @FocusState private var focusedField: Field?
    private let dashboardService: DashboardService
    private let clientsService: ClientsService
    private let loansService: LoansService
    private let upcomingPaymentsService: UpcomingPaymentsService
    private let requestsService: RequestsService
    private let apiBaseURL: URL

    public init(
        apiBaseURL: URL,
        dashboardService: DashboardService,
        clientsService: ClientsService,
        loansService: LoansService,
        upcomingPaymentsService: UpcomingPaymentsService,
        requestsService: RequestsService,
        viewModel: @autoclosure @escaping () -> LoginViewModel
    ) {
        self.apiBaseURL = apiBaseURL
        self.dashboardService = dashboardService
        self.clientsService = clientsService
        self.loansService = loansService
        self.upcomingPaymentsService = upcomingPaymentsService
        self.requestsService = requestsService
        _viewModel = StateObject(wrappedValue: viewModel())
    }

    public var body: some View {
        ZStack {
            if let session = viewModel.session {
                MainTabView(
                    session: session,
                    apiBaseURL: apiBaseURL,
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
                ScrollView {
                    VStack(alignment: .leading, spacing: 36) {
                        VStack(alignment: .leading, spacing: 24) {
                            Image(systemName: "chart.line.uptrend.xyaxis")
                                .font(.system(size: 28, weight: .semibold))
                                .foregroundStyle(Color.white)
                                .frame(width: 64, height: 64)
                                .background(Color.appGreen)
                                .clipShape(RoundedRectangle(cornerRadius: 18))

                            VStack(alignment: .leading, spacing: 8) {
                                Text("Bienvenido")
                                    .font(.system(size: 36, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color.appText)
                                Text("Gestiona tu cartera desde tu iPhone.")
                                    .font(.body)
                                    .foregroundStyle(Color.appMuted)
                            }
                        }

                        VStack(alignment: .leading, spacing: 20) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Usuario")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(Color.appText)
                                TextField("Ingresa tu usuario", text: $viewModel.username)
                                    .textContentType(.username)
#if os(iOS)
                                    .textInputAutocapitalization(.never)
#endif
                                    .autocorrectionDisabled()
                                    .submitLabel(.next)
                                    .focused($focusedField, equals: .username)
                                    .onSubmit { focusedField = .password }
                                    .padding(.horizontal, 16)
                                    .frame(height: 54)
                                    .background(Color.appSurfaceSoft)
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                            }

                            VStack(alignment: .leading, spacing: 8) {
                                Text("Contraseña")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(Color.appText)
                                SecureField("Ingresa tu contraseña", text: $viewModel.password)
                                    .textContentType(.password)
                                    .submitLabel(.go)
                                    .focused($focusedField, equals: .password)
                                    .onSubmit(submit)
                                    .padding(.horizontal, 16)
                                    .frame(height: 54)
                                    .background(Color.appSurfaceSoft)
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                            }

                            if let errorMessage = viewModel.errorMessage {
                                Label(errorMessage, systemImage: "exclamationmark.circle.fill")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(Color.appRust)
                                    .accessibilityIdentifier("login-error")
                            }

                            Button(action: submit) {
                                HStack(spacing: 10) {
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    }
                                    Text(viewModel.isLoading ? "Iniciando sesión..." : "Iniciar sesión")
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 54)
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(Color.white)
                            .background(canSubmit ? Color.appGreen : Color.appMuted.opacity(0.45))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .disabled(!canSubmit)
                            .accessibilityIdentifier("login-submit")
                        }

                        HStack(spacing: 8) {
                            Circle()
                                .fill(Color.appGreen)
                                .frame(width: 7, height: 7)
                            Text("Conexión segura con Inversiones WM")
                                .font(.caption)
                                .foregroundStyle(Color.appMuted)
                        }
                    }
                    .frame(maxWidth: 520, alignment: .leading)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 48)
                }
                .scrollDismissesKeyboard(.interactively)
                .background(Color.appBackground)
            }
        }
        .tint(.appGreen)
    }

    private var canSubmit: Bool {
        !viewModel.isLoading
            && !viewModel.username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !viewModel.password.isEmpty
    }

    private func submit() {
        guard canSubmit else { return }
        focusedField = nil
        Task { await viewModel.submit() }
    }

    private enum Field {
        case username
        case password
    }
}
