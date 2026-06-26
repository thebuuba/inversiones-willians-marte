import SwiftUI

public struct LoanDetailView: View {
    @StateObject private var viewModel: LoanDetailViewModel
    @State private var isShowingCreatePayment = false

    public init(loanId: String, accessToken: String, service: LoansService) {
        _viewModel = StateObject(
            wrappedValue: LoanDetailViewModel(accessToken: accessToken, loanId: loanId, service: service)
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
                Section("Resumen") {
                    LabeledContent("Cliente", value: detail.client.fullName)
                    LabeledContent("Producto", value: detail.product.name)
                    LabeledContent("Estado", value: detail.status)
                    LabeledContent("Balance") {
                        Text(detail.balance, format: .currency(code: "DOP"))
                    }
                    LabeledContent("Total") {
                        Text(detail.totalAmount, format: .currency(code: "DOP"))
                    }
                }

                Section("Cuotas") {
                    if detail.schedule.isEmpty {
                        Text("Sin cuotas registradas")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(detail.schedule) { row in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(row.amount, format: .currency(code: "DOP"))
                                        .font(.headline)
                                    Spacer()
                                    Text(row.status)
                                        .font(.caption.weight(.semibold))
                                }
                                Text("Capital \(row.principalPart, format: .currency(code: "DOP")) · Interés \(row.interestPart, format: .currency(code: "DOP"))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                Section("Pagos") {
                    if detail.payments.isEmpty {
                        Text("Sin pagos registrados")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(detail.payments) { payment in
                            HStack {
                                Text(payment.amount, format: .currency(code: "DOP"))
                                Spacer()
                                Text(payment.paymentMethod ?? "-")
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(viewModel.detail.map { "Préstamo #\($0.loanNumber)" } ?? "Préstamo")
        .toolbar {
            if viewModel.detail != nil {
                Button {
                    isShowingCreatePayment = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $isShowingCreatePayment) {
            CreatePaymentView { amount, paymentDate, paymentMethod, reference, notes in
                await viewModel.createPayment(
                    amount: amount,
                    paymentDate: paymentDate,
                    paymentMethod: paymentMethod,
                    reference: reference,
                    notes: notes
                )
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
