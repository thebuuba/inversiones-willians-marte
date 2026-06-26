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
        _viewModel = StateObject(wrappedValue: DashboardViewModel(accessToken: accessToken, service: service))
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
                            MetricCard(title: "Préstamos activos", value: "\(dashboard.activeLoans)", symbol: "doc.text", tint: .blue)
                            MetricCard(title: "Clientes", value: "\(dashboard.totalClients)", symbol: "person.2", tint: .green)
                            MetricCard(title: "Cobros hoy", value: dashboard.collectionsToday.formatted(.currency(code: "DOP")), symbol: "banknote", tint: .teal)
                            MetricCard(title: "Atrasados", value: "\(dashboard.overdueLoans)", symbol: "exclamationmark.triangle", tint: dashboard.overdueLoans > 0 ? .red : .secondary)
                        }

                        AttentionCard(overdueLoans: dashboard.overdueLoans)
                    }
                    .padding(16)
                }
            }
            .background(Color.dashboardBackground)
            .navigationTitle("Inicio")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Salir", action: logout)
                }
            }
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

private struct DashboardHeader: View {
    let userName: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Bienvenido, \(userName)")
                .font(.title2.weight(.semibold))
            Text(Date.now.formatted(date: .complete, time: .omitted))
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}

private struct BalanceCard: View {
    let balance: Double
    let collectionsToday: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Balance activo", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(balance, format: .currency(code: "DOP"))
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            HStack {
                Text("Cobrado hoy")
                Spacer()
                Text(collectionsToday, format: .currency(code: "DOP"))
                    .fontWeight(.semibold)
            }
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.dashboardCard)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct QuickActions: View {
    let newClient: () -> Void
    let newLoan: () -> Void
    let registerPayment: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            ActionButton(title: "Cliente", symbol: "person.badge.plus", action: newClient)
            ActionButton(title: "Préstamo", symbol: "plus.rectangle.on.document", action: newLoan)
            ActionButton(title: "Pago", symbol: "creditcard", action: registerPayment)
        }
    }
}

private struct ActionButton: View {
    let title: String
    let symbol: String
    let action: () -> Void

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
        }
        .buttonStyle(.bordered)
    }
}

private struct MetricCard: View {
    let title: String
    let value: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: symbol)
                .font(.headline)
                .foregroundStyle(tint)
            Text(value)
                .font(.title3.weight(.bold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 116, alignment: .leading)
        .background(Color.dashboardCard)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct AttentionCard: View {
    let overdueLoans: Int

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: overdueLoans > 0 ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
                .foregroundStyle(overdueLoans > 0 ? .red : .green)
            VStack(alignment: .leading, spacing: 4) {
                Text(overdueLoans > 0 ? "Atención requerida" : "Cartera al día")
                    .font(.headline)
                Text(overdueLoans > 0 ? "\(overdueLoans) préstamos necesitan seguimiento." : "No hay préstamos atrasados en el resumen.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.dashboardCard)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private extension Color {
    static let dashboardBackground = Color(red: 0.95, green: 0.96, blue: 0.95)
    static let dashboardCard = Color(red: 1, green: 1, blue: 1)
}
