import Foundation

public struct CreatePaymentInput: Encodable, Equatable, Sendable {
    public let loanId: String
    public let clientId: Int
    public let amount: Double
    public let paymentDate: String
    public let paymentMethod: String?
    public let reference: String?
    public let notes: String?

    public init(
        loanId: String,
        clientId: Int,
        amount: Double,
        paymentDate: String,
        paymentMethod: String? = nil,
        reference: String? = nil,
        notes: String? = nil
    ) {
        self.loanId = loanId
        self.clientId = clientId
        self.amount = amount
        self.paymentDate = paymentDate
        self.paymentMethod = paymentMethod
        self.reference = reference
        self.notes = notes
    }
}

public struct PaymentRecord: Decodable, Equatable, Identifiable {
    public let id: String
    public let loanId: String
    public let clientId: Int
    public let amount: Double
    public let paymentDate: String
    public let paymentMethod: String?
    public let reference: String?
    public let receivedById: String?
    public let notes: String?
    public let createdAt: String
}
