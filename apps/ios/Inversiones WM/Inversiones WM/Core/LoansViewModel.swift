import Foundation
import Combine

@MainActor
public final class LoansViewModel: ObservableObject {
    @Published public private(set) var loans: [Loan] = []
    @Published public private(set) var total = 0
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    public let accessToken: String
    public let service: LoansService

    public init(accessToken: String, service: LoansService) {
        self.accessToken = accessToken
        self.service = service
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let page = try await service.list(accessToken: accessToken)
            loans = page.data
            total = page.total
        } catch {
            errorMessage = "No se pudieron cargar los préstamos"
        }
    }

    public func create(_ input: CreateLoanInput) async -> Bool {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            _ = try await service.create(accessToken: accessToken, input: input)
            await load()
            return true
        } catch {
            errorMessage = "No se pudo crear el préstamo"
            return false
        }
    }
}
