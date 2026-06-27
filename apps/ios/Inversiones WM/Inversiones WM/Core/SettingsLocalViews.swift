import SwiftUI

struct SettingsGeneralView: View {
    @StateObject private var viewModel = LocalSettingsViewModel()

    var body: some View {
        Form {
            Section("Empresa") {
                TextField("Nombre comercial", text: $viewModel.settings.businessName)
                TextField("Correo", text: $viewModel.settings.contactEmail)
                TextField("Teléfono", text: $viewModel.settings.phone)
                TextField("Dirección", text: $viewModel.settings.address)
            }

            Section("Localización") {
                Picker("Moneda", selection: $viewModel.settings.currencyCode) {
                    Text("Peso dominicano").tag("DOP")
                    Text("Dólar").tag("USD")
                }
                Picker("Región", selection: $viewModel.settings.localeIdentifier) {
                    Text("Español República Dominicana").tag("es_DO")
                    Text("English United States").tag("en_US")
                }
            }
        }
        .navigationTitle("General")
        .onDisappear {
            viewModel.save()
        }
    }
}

struct SettingsNotificationsView: View {
    @StateObject private var viewModel = LocalSettingsViewModel()

    var body: some View {
        Form {
            Section("Recordatorios") {
                Toggle("Recordatorio de pago", isOn: $viewModel.settings.paymentRemindersEnabled)
                Stepper(
                    "Días antes: \(viewModel.settings.reminderDaysBefore)",
                    value: $viewModel.settings.reminderDaysBefore,
                    in: 0...14
                )
            }

            Section("Resumen diario") {
                Toggle("Resumen diario", isOn: $viewModel.settings.dailySummaryEnabled)
                TextField("Hora", text: $viewModel.settings.dailySummaryTime)
            }

            Section {
                Text("Estas preferencias se guardan en este dispositivo. El backend todavía no expone envíos programados.")
                    .font(.footnote)
                    .foregroundStyle(Color.appMuted)
            }
        }
        .navigationTitle("Notificaciones")
        .onDisappear {
            viewModel.save()
        }
    }
}

struct SettingsIntegrationsView: View {
    @StateObject private var viewModel: IntegrationsSettingsViewModel
    private let apiBaseURL: URL

    init(apiBaseURL: URL, service: IntegrationsSettingsService) {
        self.apiBaseURL = apiBaseURL
        _viewModel = StateObject(wrappedValue: IntegrationsSettingsViewModel(service: service))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PanelHero(title: "Integraciones", subtitle: "Estado de servicios conectados", symbol: "link")

                SettingsRow(symbol: "server.rack", title: "Backend", subtitle: apiBaseURL.absoluteString)

                if viewModel.isLoading && viewModel.status == nil {
                    ProgressView("Comprobando conexión")
                        .frame(maxWidth: .infinity, minHeight: 180)
                } else if let status = viewModel.status {
                    SettingsRow(symbol: "checkmark.circle", title: status.service, subtitle: status.status)
                } else {
                    EmptyStateCard(
                        symbol: "wifi.exclamationmark",
                        title: "Backend no disponible",
                        subtitle: viewModel.errorMessage ?? "No se pudo comprobar el estado."
                    )
                }

                EmptyStateCard(
                    symbol: "link.badge.plus",
                    title: "Sin integraciones externas",
                    subtitle: "No hay conectores externos configurados en el backend."
                )
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Integraciones")
        .task {
            if viewModel.status == nil {
                await viewModel.refresh()
            }
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
}
