import SwiftUI

public struct ClientsListView: View {
    @StateObject private var viewModel: ClientsViewModel
    @State private var isShowingCreateClient = false
    private let userName: String
    private let logout: () -> Void

    public init(
        userName: String,
        accessToken: String,
        service: ClientsService,
        logout: @escaping () -> Void
    ) {
        self.userName = userName
        self.logout = logout
        _viewModel = StateObject(wrappedValue: ClientsViewModel(accessToken: accessToken, service: service))
    }

    public var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Bienvenido, \(userName)")
                            .font(.headline)
                        Text("\(viewModel.total) clientes registrados")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }

                Section("Clientes") {
                    if viewModel.isLoading && viewModel.clients.isEmpty {
                        ProgressView()
                    } else if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    } else if viewModel.clients.isEmpty {
                        Text("No se encontraron clientes")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.clients) { client in
                            NavigationLink {
                                ClientDetailView(
                                    clientId: client.id,
                                    accessToken: viewModel.accessToken,
                                    service: viewModel.service
                                )
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(client.fullName)
                                        .font(.headline)
                                    HStack {
                                        if let phone = client.phone {
                                            Text(phone)
                                        }
                                        Text("\(client.loanCount) prestamos")
                                    }
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Clientes")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Salir", action: logout)
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        isShowingCreateClient = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $isShowingCreateClient) {
                CreateClientView { input in
                    await viewModel.create(input)
                }
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
