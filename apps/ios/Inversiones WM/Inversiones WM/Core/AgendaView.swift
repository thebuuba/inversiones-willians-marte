import SwiftUI

public struct AgendaView: View {
    @StateObject private var viewModel: AgendaViewModel

    public init(accessToken: String, service: UpcomingPaymentsService) {
        _viewModel = StateObject(wrappedValue: AgendaViewModel(accessToken: accessToken, service: service))
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHero(title: "Agenda", subtitle: "Próximos cobros programados", symbol: "calendar.badge.clock")

                    if viewModel.isLoading && viewModel.payments.isEmpty {
                        ProgressView("Cargando agenda")
                            .frame(maxWidth: .infinity, minHeight: 260)
                    } else if let errorMessage = viewModel.errorMessage {
                        EmptyStateCard(symbol: "wifi.exclamationmark", title: "Agenda no disponible", subtitle: errorMessage)
                    } else if viewModel.payments.isEmpty {
                        EmptyStateCard(symbol: "calendar", title: "Sin cobros próximos", subtitle: "No hay pagos pendientes en la agenda.")
                    } else {
                        VStack(spacing: 12) {
                            ForEach(viewModel.payments) { payment in
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Text(payment.clientName)
                                            .font(.headline)
                                            .foregroundStyle(Color.appText)
                                        Spacer()
                                        Text(payment.status)
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(Color.appGold)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(Color.appGoldSoft)
                                            .clipShape(Capsule())
                                    }
                                    HStack {
                                        Text(payment.amount, format: .currency(code: "DOP"))
                                            .fontWeight(.bold)
                                        Spacer()
                                        Text(shortDate(payment.dueDate))
                                    }
                                    .font(.subheadline)
                                    .foregroundStyle(Color.appMuted)
                                }
                                .padding(16)
                                .appCard()
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Agenda")
            .task {
                await viewModel.load()
            }
            .refreshable {
                await viewModel.load()
            }
        }
    }

    private func shortDate(_ value: String) -> String {
        String(value.prefix(10))
    }
}
