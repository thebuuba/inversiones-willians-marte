import SwiftUI

public struct DashboardView: View {
    @StateObject private var viewModel: DashboardViewModel
    private let userName: String
    private let logout: () -> Void

    public init(userName: String, accessToken: String, service: DashboardService, logout: @escaping () -> Void) {
        self.userName = userName
        self.logout = logout
        _viewModel = StateObject(wrappedValue: DashboardViewModel(accessToken: accessToken, service: service))
    }

    public var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Bienvenido, \(userName)")
                            .font(.headline)
                        Text("Resumen de hoy")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }

                if viewModel.isLoading && viewModel.dashboard == nil {
                    ProgressView()
                } else if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                } else if let dashboard = viewModel.dashboard {
                    Section("Cartera") {
                        DashboardRow("Balance activo", currency: dashboard.portfolioBalance)
                        DashboardRow("Préstamos activos", value: dashboard.activeLoans)
                        DashboardRow("Préstamos atrasados", value: dashboard.overdueLoans)
                    }

                    Section("Operación") {
                        DashboardRow("Clientes", value: dashboard.totalClients)
                        DashboardRow("Cobros de hoy", currency: dashboard.collectionsToday)
                    }
                }
            }
            .navigationTitle("Inicio")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Salir", action: logout)
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
}

private struct DashboardRow: View {
    private let label: String
    private let value: String

    init(_ label: String, value: Int) {
        self.label = label
        self.value = String(value)
    }

    init(_ label: String, currency: Double) {
        self.label = label
        self.value = currency.formatted(.currency(code: "DOP"))
    }

    var body: some View {
        LabeledContent(label, value: value)
    }
}
