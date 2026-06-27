import SwiftUI

public struct ClientsListView: View {
    @StateObject private var viewModel: ClientsViewModel
    @State private var isShowingCreateClient = false
    private let userName: String

    public init(
        userName: String,
        accessToken: String,
        service: ClientsService
    ) {
        self.userName = userName
        _viewModel = StateObject(wrappedValue: ClientsViewModel(accessToken: accessToken, service: service))
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHero(
                        title: "Clientes",
                        subtitle: "\(viewModel.total) registrados · \(userName)",
                        symbol: "person.2.fill"
                    )

                    if viewModel.isLoading && viewModel.clients.isEmpty {
                        ProgressView("Cargando clientes")
                            .frame(maxWidth: .infinity, minHeight: 260)
                    } else if let errorMessage = viewModel.errorMessage {
                        EmptyStateCard(symbol: "wifi.exclamationmark", title: "Clientes no disponibles", subtitle: errorMessage)
                    } else if viewModel.clients.isEmpty {
                        EmptyStateCard(symbol: "person.crop.circle.badge.plus", title: "Sin clientes", subtitle: "Crea tu primer cliente para empezar.")
                    } else {
                        VStack(spacing: 12) {
                            ForEach(viewModel.clients) { client in
                                NavigationLink {
                                    ClientDetailView(
                                        clientId: client.id,
                                        accessToken: viewModel.accessToken,
                                        service: viewModel.service
                                    )
                                } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: "person.fill")
                                            .font(.headline)
                                            .foregroundStyle(Color.appGreen)
                                            .frame(width: 42, height: 42)
                                            .background(Color.appGreenSoft)
                                            .clipShape(Circle())
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(client.fullName)
                                                .font(.headline)
                                                .foregroundStyle(Color.appText)
                                            Text(clientSubtitle(client))
                                                .font(.subheadline)
                                                .foregroundStyle(Color.appMuted)
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(Color.appMuted.opacity(0.55))
                                    }
                                    .padding(16)
                                    .appCard()
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Clientes")
            .toolbar {
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

    private func clientSubtitle(_ client: Client) -> String {
        let phone = client.phone ?? "Sin teléfono"
        return "\(phone) · \(client.loanCount) préstamos"
    }
}
