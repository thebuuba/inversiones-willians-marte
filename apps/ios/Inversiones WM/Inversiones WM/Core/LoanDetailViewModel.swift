import Foundation
import Combine

@MainActor
public final class LoanDetailViewModel: ObservableObject {
    @Published public private(set) var detail: LoanDetail?
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let accessToken: String
    private let loanId: String
    private let service: LoansService
    private let paymentsService: PaymentsService

    public init(accessToken: String, loanId: String, service: LoansService) {
        self.accessToken = accessToken
        self.loanId = loanId
        self.service = service
        self.paymentsService = PaymentsService(baseURL: service.baseURL)
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            detail = try await service.detail(accessToken: accessToken, id: loanId)
        } catch {
            errorMessage = "No se pudo cargar el préstamo"
        }
    }

    public func createPayment(amount: Double, paymentDate: String, paymentMethod: String?, reference: String?, notes: String?) async -> Bool {
        guard let detail else { return false }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            _ = try await paymentsService.create(
                accessToken: accessToken,
                input: CreatePaymentInput(
                    loanId: detail.id,
                    clientId: detail.clientId,
                    amount: amount,
                    paymentDate: paymentDate,
                    paymentMethod: paymentMethod,
                    reference: reference,
                    notes: notes
                )
            )
            await load()
            return true
        } catch {
            errorMessage = "No se pudo registrar el pago"
            return false
        }
    }
}
