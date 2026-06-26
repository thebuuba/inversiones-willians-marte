import SwiftUI

public struct CreateLoanView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var clients: [Client] = []
    @State private var products: [LoanProductItem] = []
    @State private var clientId: Int?
    @State private var productId: String?
    @State private var principal = ""
    @State private var term = ""
    @State private var startDate = Date()
    @State private var notes = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let accessToken: String
    private let clientsService: ClientsService
    private let productsService: LoanProductsService
    private let save: (CreateLoanInput) async -> Bool

    public init(
        accessToken: String,
        clientsService: ClientsService,
        productsService: LoanProductsService,
        save: @escaping (CreateLoanInput) async -> Bool
    ) {
        self.accessToken = accessToken
        self.clientsService = clientsService
        self.productsService = productsService
        self.save = save
    }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Cliente") {
                    Picker("Cliente", selection: $clientId) {
                        Text("Seleccionar").tag(Int?.none)
                        ForEach(clients) { client in
                            Text(client.fullName).tag(Optional(client.id))
                        }
                    }
                }

                Section("Producto") {
                    Picker("Producto", selection: $productId) {
                        Text("Seleccionar").tag(String?.none)
                        ForEach(products) { product in
                            Text(product.name).tag(Optional(product.id))
                        }
                    }
                }

                Section("Condiciones") {
                    TextField("Monto", text: $principal)
                    TextField("Plazo", text: $term)
                    DatePicker("Inicio", selection: $startDate, displayedComponents: .date)
                    TextField("Nota", text: $notes)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .navigationTitle("Nuevo préstamo")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isLoading ? "Guardando..." : "Guardar") {
                        Task { await submit() }
                    }
                    .disabled(!canSave || isLoading)
                }
            }
            .task {
                await loadOptions()
            }
        }
    }

    private var canSave: Bool {
        clientId != nil && productId != nil && parsedPrincipal != nil && parsedTerm != nil
    }

    private var parsedPrincipal: Double? {
        Double(principal.replacingOccurrences(of: ",", with: ".")).flatMap { $0 > 0 ? $0 : nil }
    }

    private var parsedTerm: Int? {
        Int(term).flatMap { $0 > 0 ? $0 : nil }
    }

    private func loadOptions() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let clientsPage = clientsService.list(accessToken: accessToken)
            async let productItems = productsService.list(accessToken: accessToken)
            clients = try await clientsPage.data
            products = try await productItems
        } catch {
            errorMessage = "No se pudieron cargar clientes o productos"
        }
    }

    private func submit() async {
        guard let clientId, let productId, let parsedPrincipal, let parsedTerm else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        let input = CreateLoanInput(
            clientId: clientId,
            productId: productId,
            principal: parsedPrincipal,
            term: parsedTerm,
            startDate: Self.formatter.string(from: startDate),
            notes: emptyToNil(notes)
        )

        if await save(input) {
            dismiss()
        } else {
            errorMessage = "No se pudo guardar"
        }
    }

    private func emptyToNil(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
