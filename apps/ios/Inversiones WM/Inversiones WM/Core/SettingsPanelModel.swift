import Foundation

public struct SettingsPanelModel: Equatable {
    public let name: String
    public let username: String
    public let email: String
    public let role: String
    public let apiBaseURL: String

    public init(session: AuthSession, apiBaseURL: URL) {
        name = session.user.name
        username = session.user.username?.isEmpty == false ? session.user.username! : "Sin usuario"
        email = session.user.email
        role = switch session.user.role {
        case "ADMIN": "Administrador"
        case "CASHIER": "Cajero"
        case "COLLECTOR": "Cobrador"
        default: session.user.role
        }
        self.apiBaseURL = apiBaseURL.absoluteString
    }
}
