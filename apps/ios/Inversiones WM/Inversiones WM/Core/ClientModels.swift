import Foundation

public struct ClientsPage: Decodable, Equatable {
    public let data: [Client]
    public let total: Int
}

public struct CreateClientInput: Encodable, Equatable, Sendable {
    public let firstName: String
    public let lastName: String
    public let phone: String?
    public let identification: String?

    public init(
        firstName: String,
        lastName: String,
        phone: String? = nil,
        identification: String? = nil
    ) {
        self.firstName = firstName
        self.lastName = lastName
        self.phone = phone
        self.identification = identification
    }
}

public struct Client: Decodable, Equatable, Identifiable {
    public let id: Int
    public let firstName: String
    public let lastName: String
    public let phone: String?
    public let identification: String?
    private let counts: ClientCounts?

    public var fullName: String {
        "\(firstName) \(lastName)"
    }

    public var loanCount: Int {
        counts?.loans ?? 0
    }

    private enum CodingKeys: String, CodingKey {
        case id
        case firstName
        case lastName
        case phone
        case identification
        case counts = "_count"
    }
}

private struct ClientCounts: Decodable, Equatable {
    let loans: Int
}

public struct ClientDetail: Decodable, Equatable, Identifiable {
    public let id: Int
    public let firstName: String
    public let lastName: String
    public let phone: String?
    public let identification: String?
    public let active: Bool
    public let loans: [ClientLoanSummary]

    public var fullName: String {
        "\(firstName) \(lastName)"
    }
}

public struct ClientLoanSummary: Decodable, Equatable, Identifiable {
    public let id: String
    public let loanNumber: Int
    public let principal: Double
    public let totalAmount: Double
    public let balance: Double
    public let status: String
    public let product: LoanProduct?
}

public struct LoanProduct: Decodable, Equatable {
    public let name: String
}
