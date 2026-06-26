import Foundation
import Security

public protocol SessionStore {
    func save(_ session: AuthSession) throws
    func load() throws -> AuthSession?
    func clear() throws
}

public enum SessionStoreError: Error, Equatable {
    case encodeFailed
    case decodeFailed
    case keychain(OSStatus)
}

public final class KeychainSessionStore: SessionStore {
    private let service: String
    private let account: String

    public init(
        service: String = "com.inversioneswilliansmarte.app",
        account: String = "auth-session"
    ) {
        self.service = service
        self.account = account
    }

    public func save(_ session: AuthSession) throws {
        let data = try JSONEncoder().encode(session)
        try clear()

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw SessionStoreError.keychain(status)
        }
    }

    public func load() throws -> AuthSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecItemNotFound {
            return nil
        }
        guard status == errSecSuccess else {
            throw SessionStoreError.keychain(status)
        }
        guard let data = result as? Data else {
            throw SessionStoreError.decodeFailed
        }

        do {
            return try JSONDecoder.inversiones.decode(AuthSession.self, from: data)
        } catch {
            throw SessionStoreError.decodeFailed
        }
    }

    public func clear() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw SessionStoreError.keychain(status)
        }
    }
}
