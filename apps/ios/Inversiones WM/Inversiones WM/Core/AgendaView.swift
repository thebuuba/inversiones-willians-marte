import SwiftUI

public struct AgendaView: View {
    @StateObject private var viewModel: AgendaViewModel

    public init(accessToken: String, service: UpcomingPaymentsService) {
        _viewModel = StateObject(wrappedValue: AgendaViewModel(accessToken: accessToken, service: service))
    }

    public var body: some View {
        NavigationStack {
            List {
                Section("Próximos cobros") {
                    if viewModel.isLoading && viewModel.payments.isEmpty {
                        ProgressView()
                    } else if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    } else if viewModel.payments.isEmpty {
                        Text("Sin cobros próximos")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.payments) { payment in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text(payment.clientName)
                                        .font(.headline)
                                    Spacer()
                                    Text(payment.status)
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.secondary)
                                }
                                HStack {
                                    Text(payment.amount, format: .currency(code: "DOP"))
                                    Spacer()
                                    Text(shortDate(payment.dueDate))
                                }
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
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
