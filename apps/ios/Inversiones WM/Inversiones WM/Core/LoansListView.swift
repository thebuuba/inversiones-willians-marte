import SwiftUI

public struct LoansListView: View {
    @StateObject private var viewModel: LoansViewModel
    @State private var isShowingCreateLoan = false
    private let clientsService: ClientsService
    private let productsService: LoanProductsService

    public init(accessToken: String, service: LoansService, clientsService: ClientsService) {
        self.clientsService = clientsService
        self.productsService = LoanProductsService(baseURL: service.baseURL)
        _viewModel = StateObject(wrappedValue: LoansViewModel(accessToken: accessToken, service: service))
    }

    public var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("\(viewModel.total) préstamos registrados")
                        .foregroundStyle(.secondary)
                }

                Section("Préstamos") {
                    if viewModel.isLoading && viewModel.loans.isEmpty {
                        ProgressView()
                    } else if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    } else if viewModel.loans.isEmpty {
                        Text("No se encontraron préstamos")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.loans) { loan in
                            NavigationLink {
                                LoanDetailView(
                                    loanId: loan.id,
                                    accessToken: viewModel.accessToken,
                                    service: viewModel.service
                                )
                            } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text("Préstamo #\(loan.loanNumber)")
                                            .font(.headline)
                                        Spacer()
                                        Text(loan.status)
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(.secondary)
                                    }
                                    Text(loan.client.fullName)
                                        .font(.subheadline)
                                    HStack {
                                        Text(loan.product.name)
                                        Spacer()
                                        Text(loan.balance, format: .currency(code: "DOP"))
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
            .navigationTitle("Préstamos")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        isShowingCreateLoan = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $isShowingCreateLoan) {
                CreateLoanView(
                    accessToken: viewModel.accessToken,
                    clientsService: clientsService,
                    productsService: productsService
                ) { input in
                    await viewModel.create(input)
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
