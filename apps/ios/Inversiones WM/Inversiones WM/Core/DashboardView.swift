import SwiftUI

public struct DashboardView: View {
    @StateObject private var viewModel: DashboardViewModel
    @State private var isShowingCreateClient = false
    @State private var isShowingCreateLoan = false
    private let userName: String
    private let accessToken: String
    private let clientsService: ClientsService
    private let loansService: LoansService
    private let productsService: LoanProductsService
    private let openLoans: () -> Void
    private let logout: () -> Void

    public init(
        userName: String,
        accessToken: String,
        service: DashboardService,
        clientsService: ClientsService,
        loansService: LoansService,
        upcomingPaymentsService: UpcomingPaymentsService,
        openLoans: @escaping () -> Void,
        logout: @escaping () -> Void
    ) {
        self.userName = userName
        self.accessToken = accessToken
        self.clientsService = clientsService
        self.loansService = loansService
        self.productsService = LoanProductsService(baseURL: loansService.baseURL)
        self.openLoans = openLoans
        self.logout = logout
        _viewModel = StateObject(
            wrappedValue: DashboardViewModel(
                accessToken: accessToken,
                service: service,
                upcomingPaymentsService: upcomingPaymentsService
            )
        )
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                if viewModel.isLoading && viewModel.dashboard == nil {
                    ProgressView("Cargando inicio")
                        .frame(maxWidth: .infinity, minHeight: 320)
                } else if let errorMessage = viewModel.errorMessage {
                    ContentUnavailableView("Inicio no disponible", systemImage: "wifi.exclamationmark", description: Text(errorMessage))
                        .padding(.top, 56)
                } else if let dashboard = viewModel.dashboard {
                    VStack(alignment: .leading, spacing: 16) {
                        DashboardHeader(userName: userName)
                        BalanceCard(balance: dashboard.portfolioBalance, collectionsToday: dashboard.collectionsToday)

                        QuickActions(
                            newClient: { isShowingCreateClient = true },
                            newLoan: { isShowingCreateLoan = true },
                            registerPayment: openLoans
                        )

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            MetricCard(
                                title: "Préstamos activos",
                                value: "\(dashboard.activeLoans)",
                                symbol: "briefcase.fill",
                                tint: .appGreen,
                                tintBackground: .appGreenSoft
                            )
                            MetricCard(
                                title: "Clientes registrados",
                                value: "\(dashboard.totalClients)",
                                symbol: "person.2.fill",
                                tint: .appRust,
                                tintBackground: .appRustSoft
                            )
                            MetricCard(
                                title: "Cobrado hoy",
                                value: dashboard.collectionsToday.formatted(.currency(code: "DOP")),
                                symbol: "dollarsign.circle.fill",
                                tint: .appGold,
                                tintBackground: .appGoldSoft
                            )
                            MetricCard(
                                title: "Atrasados",
                                value: "\(dashboard.overdueLoans)",
                                symbol: "exclamationmark.triangle.fill",
                                tint: dashboard.overdueLoans > 0 ? .appRust : .appGreen,
                                tintBackground: dashboard.overdueLoans > 0 ? .appRustSoft : .appGreenSoft
                            )
                        }

                        AttentionCard(overdueLoans: dashboard.overdueLoans)

                        UpcomingPaymentsCard(
                            payments: Array(viewModel.upcomingPayments.prefix(3)),
                            openLoans: openLoans
                        )
                    }
                    .padding(16)
                }
            }
            .background(Color.appBackground)
            .tint(.appGreen)
            .navigationTitle("Inicio")
            .sheet(isPresented: $isShowingCreateClient) {
                CreateClientView { input in
                    await createClient(input)
                }
            }
            .sheet(isPresented: $isShowingCreateLoan) {
                CreateLoanView(
                    accessToken: accessToken,
                    clientsService: clientsService,
                    productsService: productsService
                ) { input in
                    await createLoan(input)
                }
            }
            .task {
                await viewModel.load()
            }
            .refreshable {
                await viewModel.load()
            }
        }
    }

    private func createClient(_ input: CreateClientInput) async -> Bool {
        do {
            _ = try await clientsService.create(accessToken: accessToken, input: input)
            await viewModel.load()
            return true
        } catch {
            return false
        }
    }

    private func createLoan(_ input: CreateLoanInput) async -> Bool {
        do {
            _ = try await loansService.create(accessToken: accessToken, input: input)
            await viewModel.load()
            return true
        } catch {
            return false
        }
    }
}

private struct UpcomingPaymentsCard: View {
    let payments: [UpcomingPayment]
    let openLoans: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Próximos cobros")
                        .font(.headline)
                        .foregroundStyle(Color.appText)
                    Text("Cuotas que requieren seguimiento")
                        .font(.caption)
                        .foregroundStyle(Color.appMuted)
                }
                Spacer()
                Button("Ver todos", action: openLoans)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.appGreen)
            }

            if payments.isEmpty {
                Label("No hay cobros próximos", systemImage: "checkmark.circle.fill")
                    .font(.subheadline)
                    .foregroundStyle(Color.appGreen)
                    .padding(.vertical, 8)
            } else {
                ForEach(payments) { payment in
                    HStack(spacing: 12) {
                        Image(systemName: "calendar")
                            .foregroundStyle(Color.appGreen)
                            .frame(width: 36, height: 36)
                            .background(Color.appGreenSoft)
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 3) {
                            Text(payment.clientName)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Color.appText)
                                .lineLimit(1)
                            Text(formattedDate(payment.dueDate))
                                .font(.caption)
                                .foregroundStyle(Color.appMuted)
                        }
                        Spacer()
                        Text(payment.amount, format: .currency(code: "DOP"))
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(Color.appText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .appCard()
    }

    private func formattedDate(_ value: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: value) else { return value }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}

private struct DashboardHeader: View {
    let userName: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.appGreen)
                    .frame(width: 8, height: 8)
                Text("En línea")
                    .font(.caption.weight(.bold))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .foregroundStyle(Color.appGreen)
            .background(Color.appGreenSoft)
            .clipShape(Capsule())

            Text("Hola, \(userName)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(Color.appText)
            Text("Resumen de tu cartera para \(Date.now.formatted(date: .abbreviated, time: .omitted)).")
                .font(.subheadline)
                .foregroundStyle(Color.appMuted)
        }
    }
}

private struct BalanceCard: View {
    let balance: Double
    let collectionsToday: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Label("Balance activo", systemImage: "chart.line.uptrend.xyaxis")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Color.appGreen)
                Spacer()
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(Color.appGreen)
                    .font(.title3)
            }

            Text(balance, format: .currency(code: "DOP"))
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(Color.appText)
                .lineLimit(1)
                .minimumScaleFactor(0.62)

            HStack {
                Text("Cobrado hoy")
                Spacer()
                Text(collectionsToday, format: .currency(code: "DOP"))
                    .fontWeight(.semibold)
            }
            .font(.footnote)
            .foregroundStyle(Color.appMuted)
            .padding(12)
            .background(Color.white.opacity(0.72))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [.appGreenSoft, .appSurface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .appCard()
    }
}

private struct QuickActions: View {
    let newClient: () -> Void
    let newLoan: () -> Void
    let registerPayment: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            ActionButton(title: "Cliente", symbol: "person.badge.plus", action: newClient, isPrimary: false)
            ActionButton(title: "Préstamo", symbol: "plus", action: newLoan, isPrimary: true)
            ActionButton(title: "Pago", symbol: "creditcard", action: registerPayment, isPrimary: false)
        }
    }
}

private struct ActionButton: View {
    let title: String
    let symbol: String
    let action: () -> Void
    let isPrimary: Bool

    var body: some View {
        Button(action: action) {
            VStack(spacing: 7) {
                Image(systemName: symbol)
                    .font(.title3)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, minHeight: 68)
            .foregroundStyle(isPrimary ? Color.white : Color.appGreen)
            .background(isPrimary ? Color.appGreen : Color.appSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isPrimary ? Color.appGreen : Color.appBorder, lineWidth: 1)
            }
            .shadow(color: isPrimary ? Color.appGreen.opacity(0.18) : .clear, radius: 14, y: 8)
        }
        .buttonStyle(.plain)
    }
}

private struct MetricCard: View {
    let title: String
    let value: String
    let symbol: String
    let tint: Color
    let tintBackground: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: symbol)
                    .font(.headline)
                    .foregroundStyle(tint)
                    .frame(width: 38, height: 38)
                    .background(tintBackground)
                    .clipShape(Circle())
                Spacer()
            }

            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(Color.appText)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.appMuted)
                .lineLimit(2)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 116, alignment: .leading)
        .background(Color.appSurface)
        .appCard()
    }
}

private struct AttentionCard: View {
    let overdueLoans: Int

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: overdueLoans > 0 ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
                .foregroundStyle(overdueLoans > 0 ? Color.appRust : Color.appGreen)
            VStack(alignment: .leading, spacing: 4) {
                Text(overdueLoans > 0 ? "Atención requerida" : "Cartera al día")
                    .font(.headline)
                    .foregroundStyle(Color.appText)
                Text(overdueLoans > 0 ? "\(overdueLoans) préstamos necesitan seguimiento." : "No hay préstamos atrasados en el resumen.")
                    .font(.subheadline)
                    .foregroundStyle(Color.appMuted)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appSurface)
        .appCard()
    }
}
