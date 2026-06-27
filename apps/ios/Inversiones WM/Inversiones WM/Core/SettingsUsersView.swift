import SwiftUI

struct SettingsUsersView: View {
    @StateObject private var viewModel: UsersSettingsViewModel
    @State private var isShowingCreateUser = false
    private let canManageUsers: Bool

    init(accessToken: String, service: UsersSettingsService, canManageUsers: Bool) {
        _viewModel = StateObject(wrappedValue: UsersSettingsViewModel(accessToken: accessToken, service: service))
        self.canManageUsers = canManageUsers
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PanelHero(title: "Usuarios", subtitle: "\(viewModel.users.count) registrados", symbol: "person.2.fill")

                if viewModel.isLoading && viewModel.users.isEmpty {
                    ProgressView("Cargando usuarios")
                        .frame(maxWidth: .infinity, minHeight: 240)
                } else if let errorMessage = viewModel.errorMessage, viewModel.users.isEmpty {
                    EmptyStateCard(symbol: "wifi.exclamationmark", title: "Usuarios no disponibles", subtitle: errorMessage)
                } else if viewModel.users.isEmpty {
                    EmptyStateCard(symbol: "person.badge.plus", title: "Sin usuarios", subtitle: "Crea el primer usuario operativo.")
                } else {
                    VStack(spacing: 10) {
                        ForEach(viewModel.users) { user in
                            SettingsUserCard(user: user, canManageUsers: canManageUsers) {
                                Task { await viewModel.toggleActive(user) }
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Usuarios")
        .toolbar {
            if canManageUsers {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        isShowingCreateUser = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $isShowingCreateUser) {
            CreateSettingsUserView(viewModel: viewModel)
        }
        .task {
            if viewModel.users.isEmpty {
                await viewModel.load()
            }
        }
        .refreshable {
            await viewModel.load()
        }
    }
}

private struct SettingsUserCard: View {
    let user: SettingsUser
    let canManageUsers: Bool
    let toggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: user.active ? "person.crop.circle.fill.badge.checkmark" : "person.crop.circle.badge.xmark")
                    .font(.title3)
                    .foregroundStyle(user.active ? Color.appGreen : Color.appRust)
                    .frame(width: 42, height: 42)
                    .background(user.active ? Color.appGreenSoft : Color.appRustSoft)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 3) {
                    Text(user.name)
                        .font(.headline)
                        .foregroundStyle(Color.appText)
                    Text(user.email)
                        .font(.subheadline)
                        .foregroundStyle(Color.appMuted)
                    Text(user.username ?? "Sin usuario")
                        .font(.caption)
                        .foregroundStyle(Color.appMuted)
                }

                Spacer()

                Text(user.roleLabel)
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 9)
                    .padding(.vertical, 5)
                    .background(Color.appGreenSoft)
                    .clipShape(Capsule())
            }

            if canManageUsers {
                Button(role: user.active ? .destructive : nil, action: toggle) {
                    Text(user.active ? "Desactivar" : "Activar")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(user.active ? Color.appRust : Color.appGreen)
            }
        }
        .padding(16)
        .appCard()
    }
}

private struct CreateSettingsUserView: View {
    @ObservedObject var viewModel: UsersSettingsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Cuenta") {
                    TextField("Nombre", text: $viewModel.name)
                    TextField("Usuario", text: $viewModel.username)
                    TextField("Correo", text: $viewModel.email)
                    SecureField("Clave", text: $viewModel.password)
                }

                Section("Rol") {
                    Picker("Rol", selection: $viewModel.role) {
                        Text("Cobrador").tag("COLLECTOR")
                        Text("Cajero").tag("CASHIER")
                        Text("Administrador").tag("ADMIN")
                    }
                }

                if let errorMessage = viewModel.errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(Color.appRust)
                    }
                }
            }
            .navigationTitle("Nuevo usuario")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(viewModel.isSaving ? "Guardando" : "Guardar") {
                        Task {
                            if await viewModel.create() {
                                dismiss()
                            }
                        }
                    }
                    .disabled(viewModel.isSaving || viewModel.name.isEmpty || viewModel.email.isEmpty || viewModel.password.count < 10)
                }
            }
        }
    }
}
