import Foundation

public struct UpcomingPayment: Decodable, Equatable, Identifiable {
    public let id: String
    public let clientName: String
    public let dueDate: String
    public let amount: Double
    public let status: String
}
