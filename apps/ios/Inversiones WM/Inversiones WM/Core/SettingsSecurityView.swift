import SwiftUI

struct SettingsSecurityView: View {
    @StateObject private var viewModel: SecuritySettingsViewModel
    private let canViewAudit: Bool

    init(accessToken: String, service: SecuritySettingsService, canViewAudit: Bool) {
        _viewModel = StateObject(wrappedValue: SecuritySettingsViewModel(accessToken: accessToken, service: service))
        self.canViewAudit = canViewAudit
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PanelHero(title: "Seguridad", subtitle: "Perfil y actividad reciente", symbol: "lock.shield.fill")

                if viewModel.isLoading && viewModel.profile == nil {
                    ProgressView("Cargando seguridad")
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else if let errorMessage = viewModel.errorMessage, viewModel.profile == nil {
                    EmptyStateCard(symbol: "wifi.exclamationmark", title: "Seguridad no disponible", subtitle: errorMessage)
                } else {
                    if let profile = viewModel.profile {
                        VStack(spacing: 10) {
                            SettingsRow(symbol: "checkmark.shield", title: "Sesión validada", subtitle: profile.email)
                            SettingsRow(symbol: "person.crop.circle", title: "Usuario", subtitle: profile.username ?? "Sin usuario")
                            SettingsRow(symbol: "key", title: "Política de clave", subtitle: "Mínimo 10 caracteres")
                        }
                    }

                    if canViewAudit {
                        VStack(alignment: .leading, spacing: 10) {
                            SectionTitle("Actividad reciente")
                            if viewModel.events.isEmpty {
                                EmptyStateCard(symbol: "clock.arrow.circlepath", title: "Sin actividad", subtitle: "No hay eventos recientes registrados.")
                            } else {
                                ForEach(viewModel.events) { event in
                                    SecurityAuditCard(event: event)
                                }
                            }
                        }
                    } else {
                        EmptyStateCard(symbol: "lock", title: "Auditoría restringida", subtitle: "Solo administradores pueden ver actividad global.")
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Seguridad")
        .task {
            if viewModel.profile == nil {
                await viewModel.load(includeAudit: canViewAudit)
            }
        }
        .refreshable {
            await viewModel.load(includeAudit: canViewAudit)
        }
    }
}

private struct SecurityAuditCard: View {
    let event: SecurityAuditEvent

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(event.action)
                    .font(.headline)
                    .foregroundStyle(Color.appText)
                Spacer()
                Text(event.actorName)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.appGreen)
            }
            Text([event.entityType, event.entityId].compactMap { $0 }.joined(separator: " · "))
                .font(.subheadline)
                .foregroundStyle(Color.appMuted)
            Text(event.createdAt)
                .font(.caption)
                .foregroundStyle(Color.appMuted)
        }
        .padding(16)
        .appCard()
    }
}
