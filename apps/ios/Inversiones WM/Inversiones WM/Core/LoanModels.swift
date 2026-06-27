import Foundation

public struct LoansPage: Decodable, Equatable {
    public let data: [Loan]
    public let total: Int
}

public struct CreateLoanInput: Encodable, Equatable, Sendable {
    public let clientId: Int
    public let productId: String
    public let principal: Double
    public let term: Int
    public let startDate: String
    public let notes: String?

    public init(
        clientId: Int,
        productId: String,
        principal: Double,
        term: Int,
        startDate: String,
        notes: String? = nil
    ) {
        self.clientId = clientId
        self.productId = productId
        self.principal = principal
        self.term = term
        self.startDate = startDate
        self.notes = notes
    }
}

public struct Loan: Decodable, Equatable, Identifiable {
    public let id: String
    public let loanNumber: Int
    public let clientId: Int
    public let productId: String
    public let principal: Double
    public let interestRate: Double
    public let interestType: String
    public let totalAmount: Double
    public let paymentFreq: String
    public let term: Int
    public let startDate: String
    public let endDate: String?
    public let status: String
    public let balance: Double
    public let notes: String?
    public let createdAt: String
    public let client: LoanClient
    public let product: LoanProductSummary
}

public struct LoanClient: Decodable, Equatable {
    public let id: Int
    public let firstName: String
    public let lastName: String
    public let identification: String?

    public var fullName: String {
        "\(firstName) \(lastName)"
    }
}

public struct LoanProductSummary: Decodable, Equatable {
    public let id: String
    public let name: String
}

public struct LoanProductItem: Decodable, Equatable, Identifiable {
    public let id: String
    public let name: String
    public let interestType: String
    public let interestRate: Double
    public let paymentFrequency: String
    public let maxTerm: Int?
}

public struct CreateLoanProductInput: Encodable, Equatable, Sendable {
    public let name: String
    public let interestType: String
    public let interestRate: Double
    public let paymentFrequency: String
    public let maxTerm: Int?

    public init(
        name: String,
        interestType: String,
        interestRate: Double,
        paymentFrequency: String,
        maxTerm: Int? = nil
    ) {
        self.name = name
        self.interestType = interestType
        self.interestRate = interestRate
        self.paymentFrequency = paymentFrequency
        self.maxTerm = maxTerm
    }
}

public struct LoanDetail: Decodable, Equatable, Identifiable {
    public let id: String
    public let loanNumber: Int
    public let clientId: Int
    public let productId: String
    public let principal: Double
    public let interestRate: Double
    public let interestType: String
    public let totalAmount: Double
    public let paymentFreq: String
    public let term: Int
    public let startDate: String
    public let endDate: String?
    public let status: String
    public let balance: Double
    public let notes: String?
    public let createdAt: String
    public let client: LoanClient
    public let product: LoanProductSummary
    public let schedule: [LoanScheduleItem]
    public let payments: [LoanPayment]
    public let lateFees: [LoanLateFee]?
}

public struct LoanScheduleItem: Decodable, Equatable, Identifiable {
    public let id: String
    public let loanId: String
    public let dueDate: String
    public let amount: Double
    public let principalPart: Double
    public let interestPart: Double
    public let balanceAfter: Double
    public let status: String
    public let paidDate: String?
    public let paidAmount: Double?
}

public struct LoanPayment: Decodable, Equatable, Identifiable {
    public let id: String
    public let amount: Double
    public let paymentDate: String
    public let paymentMethod: String?
    public let reference: String?
    public let notes: String?
}

public struct LoanLateFee: Decodable, Equatable, Identifiable {
    public let id: String
    public let loanId: String
    public let scheduleId: String
    public let amount: Double
    public let calculatedDate: String
    public let paid: Bool
    public let createdAt: String
}
