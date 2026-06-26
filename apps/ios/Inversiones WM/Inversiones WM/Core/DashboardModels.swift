import Foundation

public struct DashboardData: Decodable, Equatable {
    public let activeLoans: Int
    public let totalClients: Int
    public let collectionsToday: Double
    public let portfolioBalance: Double
    public let overdueLoans: Int
}
