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
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHero(
                        title: "Préstamos",
                        subtitle: "\(viewModel.total) registrados",
                        symbol: "doc.text.fill"
                    )

                    if viewModel.isLoading && viewModel.loans.isEmpty {
                        ProgressView("Cargando préstamos")
                            .frame(maxWidth: .infinity, minHeight: 260)
                    } else if let errorMessage = viewModel.errorMessage {
                        EmptyStateCard(symbol: "wifi.exclamationmark", title: "Préstamos no disponibles", subtitle: errorMessage)
                    } else if viewModel.loans.isEmpty {
                        EmptyStateCard(symbol: "doc.badge.plus", title: "Sin préstamos", subtitle: "Crea el primer préstamo para verlo aquí.")
                    } else {
                        VStack(spacing: 12) {
                            ForEach(viewModel.loans) { loan in
                                NavigationLink {
                                    LoanDetailView(
                                        loanId: loan.id,
                                        accessToken: viewModel.accessToken,
                                        service: viewModel.service
                                    )
                                } label: {
                                    VStack(alignment: .leading, spacing: 12) {
                                        HStack(alignment: .top) {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text("Préstamo #\(loan.loanNumber)")
                                                    .font(.headline)
                                                    .foregroundStyle(Color.appText)
                                                Text(loan.client.fullName)
                                                    .font(.subheadline)
                                                    .foregroundStyle(Color.appMuted)
                                            }
                                            Spacer()
                                            Text(loan.status)
                                                .font(.caption.weight(.bold))
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 6)
                                                .foregroundStyle(Color.appGreen)
                                                .background(Color.appGreenSoft)
                                                .clipShape(Capsule())
                                        }

                                        HStack {
                                            Label(loan.product.name, systemImage: "briefcase")
                                            Spacer()
                                            Text(loan.balance, format: .currency(code: "DOP"))
                                                .fontWeight(.bold)
                                        }
                                        .font(.subheadline)
                                        .foregroundStyle(Color.appMuted)
                                    }
                                    .padding(16)
                                    .appCard()
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
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
