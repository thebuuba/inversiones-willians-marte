import SwiftUI
import Combine

public struct MainTabView: View {
    @State private var selectedTab = 0
    private let session: AuthSession
    private let apiBaseURL: URL
    private let accessToken: String
    private let dashboardService: DashboardService
    private let clientsService: ClientsService
    private let loansService: LoansService
    private let upcomingPaymentsService: UpcomingPaymentsService
    private let requestsService: RequestsService
    private let usersSettingsService: UsersSettingsService
    private let settingsLoanProductsService: LoanProductsService
    private let securitySettingsService: SecuritySettingsService
    private let integrationsSettingsService: IntegrationsSettingsService
    private let logout: () -> Void

    public init(
        session: AuthSession,
        apiBaseURL: URL,
        accessToken: String,
        dashboardService: DashboardService,
        clientsService: ClientsService,
        loansService: LoansService,
        upcomingPaymentsService: UpcomingPaymentsService,
        requestsService: RequestsService,
        logout: @escaping () -> Void
    ) {
        self.session = session
        self.apiBaseURL = apiBaseURL
        self.accessToken = accessToken
        self.dashboardService = dashboardService
        self.clientsService = clientsService
        self.loansService = loansService
        self.upcomingPaymentsService = upcomingPaymentsService
        self.requestsService = requestsService
        usersSettingsService = UsersSettingsService(baseURL: apiBaseURL)
        settingsLoanProductsService = LoanProductsService(baseURL: apiBaseURL)
        securitySettingsService = SecuritySettingsService(baseURL: apiBaseURL)
        integrationsSettingsService = IntegrationsSettingsService(baseURL: apiBaseURL)
        self.logout = logout
    }

    public var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(
                userName: session.user.name,
                accessToken: accessToken,
                service: dashboardService,
                clientsService: clientsService,
                loansService: loansService,
                openLoans: { selectedTab = 2 },
                logout: logout
            )
            .tabItem {
                Label("Inicio", systemImage: "house")
            }
            .tag(0)

            ClientsListView(
                userName: session.user.name,
                accessToken: accessToken,
                service: clientsService
            )
            .tabItem {
                Label("Clientes", systemImage: "person.2")
            }
            .tag(1)

            LoansListView(accessToken: accessToken, service: loansService, clientsService: clientsService)
                .tabItem {
                    Label("Préstamos", systemImage: "doc.text")
                }
                .tag(2)

            RequestsView(accessToken: accessToken, service: requestsService)
                .tabItem {
                    Label("Solicitudes", systemImage: "tray.full")
                }
                .tag(3)

            SettingsView(
                model: SettingsPanelModel(session: session, apiBaseURL: apiBaseURL),
                apiBaseURL: apiBaseURL,
                accessToken: accessToken,
                userRole: session.user.role,
                usersService: usersSettingsService,
                loanProductsService: settingsLoanProductsService,
                securityService: securitySettingsService,
                integrationsService: integrationsSettingsService,
                logout: logout
            )
                .tabItem {
                    Label("Configuración", systemImage: "gearshape")
                }
                .tag(4)
        }
        .tint(.appGreen)
    }
}

private struct RequestsView: View {
    @StateObject private var viewModel: RequestsViewModel
    @State private var isShowingCreateRequest = false
    @State private var selectedRequest: LoanRequestItem?
    @State private var searchText = ""
    @State private var isHistoryExpanded = false

    init(accessToken: String, service: RequestsService) {
        _viewModel = StateObject(wrappedValue: RequestsViewModel(accessToken: accessToken, service: service))
    }

    var body: some View {
        let visibleRequests = viewModel.filteredRequests(searchText)
        let pendingRequests = visibleRequests.filter { $0.status == "PENDING" }
        let historyRequests = visibleRequests.filter { $0.status != "PENDING" }

        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHero(
                        title: "Solicitudes",
                        subtitle: "\(viewModel.pendingCount) pendientes · \(viewModel.requests.count) total",
                        symbol: "tray.full.fill"
                    )

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        RequestStatCard(title: "Total", value: "\(viewModel.requests.count)", symbol: "tray.full.fill", tint: .appGreen, background: .appGreenSoft)
                        RequestStatCard(title: "Pendientes", value: "\(viewModel.pendingCount)", symbol: "clock.fill", tint: .appGold, background: .appGoldSoft)
                        RequestStatCard(title: "Aprobadas", value: "\(viewModel.approvedCount)", symbol: "checkmark.seal.fill", tint: .appBlue, background: .appBlueSoft)
                        RequestStatCard(title: "Rechazadas", value: "\(viewModel.rejectedCount)", symbol: "xmark.seal.fill", tint: .appRust, background: .appRustSoft)
                    }

                    SearchField(text: $searchText)

                    if viewModel.isLoading && viewModel.requests.isEmpty {
                        ProgressView("Cargando solicitudes")
                            .frame(maxWidth: .infinity, minHeight: 260)
                    } else if let errorMessage = viewModel.errorMessage {
                        EmptyStateCard(symbol: "wifi.exclamationmark", title: "Solicitudes no disponibles", subtitle: errorMessage)
                    } else if viewModel.requests.isEmpty {
                        EmptyStateCard(
                            symbol: "doc.badge.plus",
                            title: "Sin solicitudes",
                            subtitle: "Crea una solicitud nueva para verla aquí."
                        )
                    } else if visibleRequests.isEmpty {
                        EmptyStateCard(
                            symbol: "magnifyingglass",
                            title: "Sin resultados",
                            subtitle: "Prueba con otro nombre, código, teléfono o cédula."
                        )
                    } else {
                        if pendingRequests.isEmpty {
                            EmptyStateCard(
                                symbol: "checkmark.seal",
                                title: "Sin pendientes",
                                subtitle: searchText.isEmpty ? "No hay solicitudes pendientes." : "No hay pendientes con esta búsqueda."
                            )
                        } else {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionTitle("Pendientes")
                                ForEach(pendingRequests) { request in
                                    RequestCard(request: request) {
                                        selectedRequest = request
                                    }
                                }
                            }
                        }

                        if !historyRequests.isEmpty {
                            VStack(spacing: 10) {
                                Button {
                                    withAnimation(.snappy) {
                                        isHistoryExpanded.toggle()
                                    }
                                } label: {
                                    HStack {
                                        Label("Historial", systemImage: "clock.arrow.circlepath")
                                            .font(.headline)
                                        Spacer()
                                        Text("\(historyRequests.count)")
                                            .font(.caption.weight(.bold))
                                            .padding(.horizontal, 9)
                                            .padding(.vertical, 5)
                                            .background(Color.appGreenSoft)
                                            .clipShape(Capsule())
                                        Image(systemName: isHistoryExpanded ? "chevron.up" : "chevron.down")
                                            .font(.caption.weight(.bold))
                                    }
                                    .foregroundStyle(Color.appText)
                                    .padding(14)
                                    .appCard()
                                }
                                .buttonStyle(.plain)

                                if isHistoryExpanded || !searchText.isEmpty {
                                    ForEach(historyRequests) { request in
                                        RequestCard(request: request) {
                                            selectedRequest = request
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Solicitudes")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        isShowingCreateRequest = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $isShowingCreateRequest) {
                CreateRequestView { input in
                    await viewModel.create(input)
                }
            }
            .sheet(item: $selectedRequest) { request in
                RequestDetailView(
                    request: request,
                    approve: { await viewModel.approve(request) },
                    reject: { await viewModel.reject(request) }
                )
            }
            .task {
                await viewModel.load()
            }
            .refreshable {
                await viewModel.load()
            }
        }
    }
}

private struct SearchField: View {
    @Binding var text: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(Color.appMuted)
            TextField("Buscar por nombre, código, cédula...", text: $text)
            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Color.appMuted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .appCard()
    }
}

struct SectionTitle: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundStyle(Color.appText)
    }
}

private struct RequestStatCard: View {
    let title: String
    let value: String
    let symbol: String
    let tint: Color
    let background: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: symbol)
                .font(.headline)
                .foregroundStyle(tint)
                .frame(width: 36, height: 36)
                .background(background)
                .clipShape(Circle())
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(Color.appText)
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.appMuted)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 118, alignment: .leading)
        .appCard()
    }
}

private struct RequestCard: View {
    let request: LoanRequestItem
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    Text(initials)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Color.appGreen)
                        .frame(width: 44, height: 44)
                        .background(Color.appGreenSoft)
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 4) {
                        Text(request.fullName)
                            .font(.headline)
                            .foregroundStyle(Color.appText)
                        Text(request.code)
                            .font(.subheadline)
                            .foregroundStyle(Color.appMuted)
                    }
                    Spacer()
                    StatusPill(status: request.status)
                }

                HStack {
                    Text(request.amount, format: .currency(code: "DOP"))
                        .font(.headline)
                        .foregroundStyle(Color.appText)
                    Spacer()
                    Text(shortDate(request.createdAt))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.appMuted)
                }

                if let description = request.description, !description.isEmpty {
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(Color.appMuted)
                        .lineLimit(2)
                }
            }
            .padding(16)
            .appCard()
        }
        .buttonStyle(.plain)
    }

    private var initials: String {
        "\(request.firstName.prefix(1))\(request.lastName.prefix(1))"
    }

    private func shortDate(_ value: String) -> String {
        String(value.prefix(10))
    }
}

private struct RequestDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isSaving = false
    @State private var errorMessage: String?
    let request: LoanRequestItem
    let approve: () async -> Bool
    let reject: () async -> Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHero(title: request.fullName, subtitle: request.code, symbol: "doc.text.fill")

                    VStack(alignment: .leading, spacing: 14) {
                        DetailRow(title: "Estado", value: statusLabel(request.status))
                        DetailRow(title: "Monto", value: request.amount.formatted(.currency(code: "DOP")))
                        if let phone = request.phone, !phone.isEmpty {
                            DetailRow(title: "Teléfono", value: phone)
                        }
                        if let identification = request.identification, !identification.isEmpty {
                            DetailRow(title: "Cédula", value: identification)
                        }
                        if let reference = request.reference, !reference.isEmpty {
                            DetailRow(title: "Referencia", value: reference)
                        }
                        if let description = request.description, !description.isEmpty {
                            Text(description)
                                .font(.subheadline)
                                .foregroundStyle(Color.appMuted)
                                .padding(.top, 4)
                        }
                    }
                    .padding(16)
                    .appCard()

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    if request.status == "PENDING" {
                        HStack(spacing: 10) {
                            Button {
                                Task { await decide(reject) }
                            } label: {
                                Text("Rechazar")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                            .disabled(isSaving)

                            Button {
                                Task { await decide(approve) }
                            } label: {
                                Text("Aprobar")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.appGreen)
                            .disabled(isSaving)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Solicitud")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }

    @MainActor
    private func decide(_ action: () async -> Bool) async {
        isSaving = true
        errorMessage = nil
        if await action() {
            dismiss()
        } else {
            errorMessage = "No se pudo actualizar la solicitud."
        }
        isSaving = false
    }

    private func statusLabel(_ value: String) -> String {
        switch value {
        case "PENDING": "Pendiente"
        case "UNDER_REVIEW": "En revisión"
        case "APPROVED": "Aprobada"
        case "REJECTED": "Rechazada"
        default: value
        }
    }
}

private struct DetailRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .foregroundStyle(Color.appMuted)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
                .foregroundStyle(Color.appText)
        }
        .font(.subheadline)
    }
}

private struct StatusPill: View {
    let status: String

    var body: some View {
        Text(label)
            .font(.caption.weight(.bold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(background)
            .clipShape(Capsule())
    }

    private var label: String {
        switch status {
        case "PENDING": "Pendiente"
        case "UNDER_REVIEW": "En revisión"
        case "APPROVED": "Aprobada"
        case "REJECTED": "Rechazada"
        default: status
        }
    }

    private var color: Color {
        switch status {
        case "APPROVED": .appGreen
        case "REJECTED": .appRust
        default: .appGold
        }
    }

    private var background: Color {
        switch status {
        case "APPROVED": .appGreenSoft
        case "REJECTED": .appRustSoft
        default: .appGoldSoft
        }
    }
}

private final class RequestsViewModel: ObservableObject {
    let accessToken: String
    let service: RequestsService
    @Published var requests: [LoanRequestItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    var pendingCount: Int {
        requests.filter { $0.status == "PENDING" }.count
    }

    var approvedCount: Int {
        requests.filter { $0.status == "APPROVED" }.count
    }

    var rejectedCount: Int {
        requests.filter { $0.status == "REJECTED" }.count
    }

    init(accessToken: String, service: RequestsService) {
        self.accessToken = accessToken
        self.service = service
    }

    func filteredRequests(_ query: String) -> [LoanRequestItem] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty else { return requests }

        return requests.filter { request in
            [
                request.fullName,
                request.code,
                request.identification ?? "",
                request.phone ?? "",
                request.description ?? "",
                request.reference ?? "",
            ].contains { value in
                value.lowercased().contains(trimmed)
            }
        }
    }

    @MainActor
    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            requests = try await service.list(accessToken: accessToken)
        } catch {
            errorMessage = "No se pudieron cargar las solicitudes."
        }
        isLoading = false
    }

    @MainActor
    func create(_ input: CreateRequestInput) async -> Bool {
        do {
            _ = try await service.create(accessToken: accessToken, input: input)
            await load()
            return true
        } catch {
            errorMessage = "No se pudo crear la solicitud."
            return false
        }
    }

    @MainActor
    func approve(_ request: LoanRequestItem) async -> Bool {
        await updateRequest {
            try await service.approve(accessToken: accessToken, id: request.id)
        }
    }

    @MainActor
    func reject(_ request: LoanRequestItem) async -> Bool {
        await updateRequest {
            try await service.reject(accessToken: accessToken, id: request.id)
        }
    }

    @MainActor
    private func updateRequest(_ operation: () async throws -> LoanRequestItem) async -> Bool {
        do {
            _ = try await operation()
            await load()
            return true
        } catch {
            errorMessage = "No se pudo actualizar la solicitud."
            return false
        }
    }
}

private struct CreateRequestView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var identification = ""
    @State private var phone = ""
    @State private var amount = ""
    @State private var description = ""
    @State private var reference = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    let onSave: (CreateRequestInput) async -> Bool

    var body: some View {
        NavigationStack {
            Form {
                Section("Cliente") {
                    TextField("Nombre", text: $firstName)
                    TextField("Apellido", text: $lastName)
                    TextField("Cédula", text: $identification)
                    TextField("Teléfono", text: $phone)
                }

                Section("Solicitud") {
                    TextField("Monto", text: $amount)
                    TextField("Descripción", text: $description, axis: .vertical)
                    TextField("Referencia", text: $reference)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .navigationTitle("Nueva solicitud")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Guardando..." : "Guardar") {
                        Task { await save() }
                    }
                    .disabled(isSaving || !canSave)
                }
            }
        }
    }

    private var canSave: Bool {
        firstName.count >= 2 && lastName.count >= 2 && parsedAmount > 0
    }

    private var parsedAmount: Double {
        Double(amount.replacingOccurrences(of: ",", with: ".")) ?? 0
    }

    @MainActor
    private func save() async {
        isSaving = true
        errorMessage = nil
        let input = CreateRequestInput(
            firstName: firstName,
            lastName: lastName,
            identification: emptyToNil(identification),
            phone: emptyToNil(phone),
            amount: parsedAmount,
            description: emptyToNil(description),
            reference: emptyToNil(reference)
        )
        if await onSave(input) {
            dismiss()
        } else {
            errorMessage = "Revisa los datos e intenta de nuevo."
        }
        isSaving = false
    }

    private func emptyToNil(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

private struct SettingsView: View {
    let model: SettingsPanelModel
    let apiBaseURL: URL
    let accessToken: String
    let userRole: String
    let usersService: UsersSettingsService
    let loanProductsService: LoanProductsService
    let securityService: SecuritySettingsService
    let integrationsService: IntegrationsSettingsService
    let logout: () -> Void
    @State private var isConfirmingLogout = false

    private var canViewUsers: Bool {
        userRole == "ADMIN" || userRole == "COLLECTOR"
    }

    private var canManageUsers: Bool {
        userRole == "ADMIN"
    }

    private var canManageLoanProducts: Bool {
        userRole == "ADMIN"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHero(title: "Configuración", subtitle: model.name, symbol: "gearshape.fill")

                    VStack(spacing: 12) {
                        NavigationLink {
                            SettingsGeneralView()
                        } label: {
                            SettingsRow(symbol: "building.2", title: "General", subtitle: "Empresa y localización")
                        }
                        .buttonStyle(.plain)
                        SettingsRow(symbol: "person.crop.circle", title: "Nombre", subtitle: model.name)
                        SettingsRow(symbol: "person.text.rectangle", title: "Usuario", subtitle: model.username)
                        SettingsRow(symbol: "envelope", title: "Correo", subtitle: model.email)
                        SettingsRow(symbol: "shield.lefthalf.filled", title: "Rol", subtitle: model.role)
                        SettingsRow(symbol: "wifi", title: "Servidor", subtitle: model.apiBaseURL)
                        NavigationLink {
                            SettingsLoanProductsView(
                                accessToken: accessToken,
                                service: loanProductsService,
                                canManageProducts: canManageLoanProducts
                            )
                        } label: {
                            SettingsRow(symbol: "creditcard", title: "Préstamos", subtitle: canManageLoanProducts ? "Crear, editar y desactivar productos" : "Consulta de productos")
                        }
                        .buttonStyle(.plain)
                        NavigationLink {
                            SettingsSecurityView(
                                accessToken: accessToken,
                                service: securityService,
                                canViewAudit: userRole == "ADMIN"
                            )
                        } label: {
                            SettingsRow(symbol: "lock.shield", title: "Seguridad", subtitle: userRole == "ADMIN" ? "Perfil y auditoría reciente" : "Perfil validado")
                        }
                        .buttonStyle(.plain)
                        if canViewUsers {
                            NavigationLink {
                                SettingsUsersView(
                                    accessToken: accessToken,
                                    service: usersService,
                                    canManageUsers: canManageUsers
                                )
                            } label: {
                                SettingsRow(symbol: "person.2", title: "Usuarios", subtitle: canManageUsers ? "Crear, activar y desactivar usuarios" : "Consulta de usuarios")
                            }
                            .buttonStyle(.plain)
                        } else {
                            SettingsRow(symbol: "lock", title: "Usuarios", subtitle: "Disponible para administradores y cobradores")
                        }
                        NavigationLink {
                            SettingsNotificationsView()
                        } label: {
                            SettingsRow(symbol: "bell", title: "Notificaciones", subtitle: "Preferencias locales")
                        }
                        .buttonStyle(.plain)
                        NavigationLink {
                            SettingsIntegrationsView(apiBaseURL: apiBaseURL, service: integrationsService)
                        } label: {
                            SettingsRow(symbol: "link", title: "Integraciones", subtitle: "Estado del backend")
                        }
                        .buttonStyle(.plain)
                        Button(role: .destructive) {
                            isConfirmingLogout = true
                        } label: {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Cerrar sesión")
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(Color.appRust)
                        .appCard()
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Configuración")
            .confirmationDialog("Cerrar sesión", isPresented: $isConfirmingLogout, titleVisibility: .visible) {
                Button("Cerrar sesión", role: .destructive, action: logout)
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Tendrás que iniciar sesión de nuevo para continuar.")
            }
        }
    }
}

struct SettingsRow: View {
    let symbol: String
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.headline)
                .foregroundStyle(Color.appGreen)
                .frame(width: 42, height: 42)
                .background(Color.appGreenSoft)
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.appText)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Color.appMuted)
            }
            Spacer()
        }
        .padding(16)
        .appCard()
    }
}
