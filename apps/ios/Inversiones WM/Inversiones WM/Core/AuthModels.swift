import Foundation

public struct APIResponse<T: Decodable>: Decodable {
    public let success: Bool
    public let data: T?
    public let error: String?
    public let message: String?
}

public struct AuthSession: Codable, Equatable {
    public let accessToken: String
    public let user: User
}

public struct User: Codable, Equatable {
    public let id: String
    public let name: String
    public let username: String?
    public let email: String
    public let role: String
}

public extension JSONDecoder {
    static var inversiones: JSONDecoder {
        JSONDecoder()
    }
}
