import SwiftUI

public struct MainTabView: View {
    @State private var selectedTab = 0
    private let userName: String
    private let accessToken: String
    private let dashboardService: DashboardService
    private let clientsService: ClientsService
    private let loansService: LoansService
    private let upcomingPaymentsService: UpcomingPaymentsService
    private let logout: () -> Void

    public init(
        userName: String,
        accessToken: String,
        dashboardService: DashboardService,
        clientsService: ClientsService,
        loansService: LoansService,
        upcomingPaymentsService: UpcomingPaymentsService,
        logout: @escaping () -> Void
    ) {
        self.userName = userName
        self.accessToken = accessToken
        self.dashboardService = dashboardService
        self.clientsService = clientsService
        self.loansService = loansService
        self.upcomingPaymentsService = upcomingPaymentsService
        self.logout = logout
    }

    public var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(
                userName: userName,
                accessToken: accessToken,
                service: dashboardService,
                clientsService: clientsService,
                loansService: loansService,
                openLoans: { selectedTab = 3 },
                logout: logout
            )
            .tabItem {
                Label("Inicio", systemImage: "house")
            }
            .tag(0)

            ClientsListView(
                userName: userName,
                accessToken: accessToken,
                service: clientsService,
                logout: logout
            )
            .tabItem {
                Label("Clientes", systemImage: "person.2")
            }
            .tag(1)

            AgendaView(accessToken: accessToken, service: upcomingPaymentsService)
                .tabItem {
                    Label("Agenda", systemImage: "calendar")
                }
                .tag(2)

            LoansListView(accessToken: accessToken, service: loansService, clientsService: clientsService)
                .tabItem {
                    Label("Préstamos", systemImage: "doc.text")
                }
                .tag(3)
        }
    }
}
