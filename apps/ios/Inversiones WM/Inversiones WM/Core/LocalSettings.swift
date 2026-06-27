import Foundation
import Combine

public struct LocalSettings: Codable, Equatable, Sendable {
    public var businessName: String
    public var contactEmail: String
    public var phone: String
    public var address: String
    public var currencyCode: String
    public var localeIdentifier: String
    public var paymentRemindersEnabled: Bool
    public var dailySummaryEnabled: Bool
    public var reminderDaysBefore: Int
    public var dailySummaryTime: String

    public static let defaults = LocalSettings(
        businessName: "Inversiones Willians Marte",
        contactEmail: "",
        phone: "",
        address: "",
        currencyCode: "DOP",
        localeIdentifier: "es_DO",
        paymentRemindersEnabled: true,
        dailySummaryEnabled: false,
        reminderDaysBefore: 1,
        dailySummaryTime: "07:00"
    )
}

public struct LocalSettingsStore {
    private let defaults: UserDefaults
    private let key = "inversiones.localSettings"

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func load() -> LocalSettings {
        guard
            let data = defaults.data(forKey: key),
            let settings = try? JSONDecoder().decode(LocalSettings.self, from: data)
        else {
            return .defaults
        }
        return settings
    }

    public func save(_ settings: LocalSettings) {
        if let data = try? JSONEncoder().encode(settings) {
            defaults.set(data, forKey: key)
        }
    }
}

@MainActor
public final class LocalSettingsViewModel: ObservableObject {
    @Published public var settings: LocalSettings
    private let store: LocalSettingsStore

    public convenience init() {
        self.init(store: LocalSettingsStore(defaults: .standard))
    }

    public init(store: LocalSettingsStore) {
        self.store = store
        settings = store.load()
    }

    public func save() {
        store.save(settings)
    }
}
