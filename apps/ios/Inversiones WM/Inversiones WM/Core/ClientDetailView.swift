import SwiftUI

public struct ClientDetailView: View {
    @StateObject private var viewModel: ClientDetailViewModel
    @State private var isEditing = false
    private let accessToken: String
    private let loansService: LoansService

    public init(clientId: Int, accessToken: String, service: ClientsService) {
        self.accessToken = accessToken
        self.loansService = LoansService(baseURL: service.baseURL)
        _viewModel = StateObject(
            wrappedValue: ClientDetailViewModel(accessToken: accessToken, clientId: clientId, service: service)
        )
    }

    public var body: some View {
        List {
            if viewModel.isLoading && viewModel.detail == nil {
                ProgressView()
            } else if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundStyle(.red)
            } else if let detail = viewModel.detail {
                Section("Información") {
                    LabeledContent("Nombre", value: detail.fullName)
                    LabeledContent("Teléfono", value: detail.phone ?? "-")
                    LabeledContent("Cédula", value: detail.identification ?? "-")
                    LabeledContent("Estado", value: detail.active ? "Activo" : "Inactivo")
                }

                Section("Préstamos") {
                    if detail.loans.isEmpty {
                        Text("Sin préstamos registrados")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(detail.loans) { loan in
                            NavigationLink {
                                LoanDetailView(loanId: loan.id, accessToken: accessToken, service: loansService)
                            } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Préstamo #\(loan.loanNumber)")
                                        .font(.headline)
                                    if let product = loan.product?.name {
                                        Text(product)
                                            .font(.subheadline)
                                    }
                                    HStack {
                                        Text("Balance: \(loan.balance, format: .currency(code: "DOP"))")
                                        Spacer()
                                        Text(loan.status)
                                    }
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(viewModel.detail?.fullName ?? "Cliente")
        .toolbar {
            if viewModel.detail != nil {
                Button("Editar") {
                    isEditing = true
                }
            }
        }
        .sheet(isPresented: $isEditing) {
            if let detail = viewModel.detail {
                CreateClientView(title: "Editar cliente", client: detail) { input in
                    await viewModel.update(input)
                }
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
