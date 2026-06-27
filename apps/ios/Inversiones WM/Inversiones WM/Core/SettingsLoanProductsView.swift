import SwiftUI

struct SettingsLoanProductsView: View {
    @StateObject private var viewModel: LoanProductsSettingsViewModel
    @State private var isShowingForm = false
    @State private var isConfirmingDelete = false
    @State private var productToDelete: LoanProductItem?
    private let canManageProducts: Bool

    init(accessToken: String, service: LoanProductsService, canManageProducts: Bool) {
        _viewModel = StateObject(wrappedValue: LoanProductsSettingsViewModel(accessToken: accessToken, service: service))
        self.canManageProducts = canManageProducts
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PanelHero(title: "Préstamos", subtitle: "\(viewModel.products.count) productos activos", symbol: "creditcard.fill")

                if viewModel.isLoading && viewModel.products.isEmpty {
                    ProgressView("Cargando productos")
                        .frame(maxWidth: .infinity, minHeight: 240)
                } else if let errorMessage = viewModel.errorMessage, viewModel.products.isEmpty {
                    EmptyStateCard(symbol: "wifi.exclamationmark", title: "Productos no disponibles", subtitle: errorMessage)
                } else if viewModel.products.isEmpty {
                    EmptyStateCard(symbol: "creditcard", title: "Sin productos", subtitle: "Crea productos para usarlos al registrar préstamos.")
                } else {
                    VStack(spacing: 10) {
                        ForEach(viewModel.products) { product in
                            LoanProductSettingsCard(product: product, canManageProducts: canManageProducts) {
                                viewModel.edit(product)
                                isShowingForm = true
                            } delete: {
                                productToDelete = product
                                isConfirmingDelete = true
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Préstamos")
        .toolbar {
            if canManageProducts {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        viewModel.clearForm()
                        isShowingForm = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $isShowingForm) {
            LoanProductFormView(viewModel: viewModel)
        }
        .confirmationDialog("Desactivar producto", isPresented: $isConfirmingDelete, titleVisibility: .visible) {
            Button("Desactivar", role: .destructive) {
                if let productToDelete {
                    Task { await viewModel.delete(productToDelete) }
                }
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("El producto no aparecerá al crear préstamos nuevos.")
        }
        .task {
            if viewModel.products.isEmpty {
                await viewModel.load()
            }
        }
        .refreshable {
            await viewModel.load()
        }
    }
}

private struct LoanProductSettingsCard: View {
    let product: LoanProductItem
    let canManageProducts: Bool
    let edit: () -> Void
    let delete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "creditcard")
                    .font(.title3)
                    .foregroundStyle(Color.appGreen)
                    .frame(width: 42, height: 42)
                    .background(Color.appGreenSoft)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(product.name)
                        .font(.headline)
                        .foregroundStyle(Color.appText)
                    Text("\(product.interestRate, format: .number.precision(.fractionLength(0...2)))% · \(product.paymentFrequency)")
                        .font(.subheadline)
                        .foregroundStyle(Color.appMuted)
                    Text(product.interestType)
                        .font(.caption)
                        .foregroundStyle(Color.appMuted)
                }

                Spacer()

                if let maxTerm = product.maxTerm {
                    Text("\(maxTerm) meses")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(Color.appGreenSoft)
                        .clipShape(Capsule())
                }
            }

            if canManageProducts {
                HStack {
                    Button("Editar", action: edit)
                        .buttonStyle(.bordered)
                        .tint(Color.appGreen)
                    Button("Desactivar", role: .destructive, action: delete)
                        .buttonStyle(.bordered)
                        .tint(Color.appRust)
                }
            }
        }
        .padding(16)
        .appCard()
    }
}

private struct LoanProductFormView: View {
    @ObservedObject var viewModel: LoanProductsSettingsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Producto") {
                    TextField("Nombre", text: $viewModel.name)
                    TextField("Tasa", text: $viewModel.interestRate)
                    TextField("Plazo máximo", text: $viewModel.maxTerm)
                }

                Section("Cálculo") {
                    Picker("Tipo de interés", selection: $viewModel.interestType) {
                        Text("Fijo").tag("FLAT")
                        Text("Saldo insoluto").tag("DECLINING_BALANCE")
                    }
                    Picker("Frecuencia de pago", selection: $viewModel.paymentFrequency) {
                        Text("Mensual").tag("MONTHLY")
                        Text("Quincenal").tag("BIWEEKLY")
                        Text("Semanal").tag("WEEKLY")
                        Text("Diario").tag("DAILY")
                    }
                }

                if let errorMessage = viewModel.errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(Color.appRust)
                    }
                }
            }
            .navigationTitle(viewModel.editingProduct == nil ? "Nuevo producto" : "Editar producto")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(viewModel.isSaving ? "Guardando" : "Guardar") {
                        Task {
                            if await viewModel.save() {
                                dismiss()
                            }
                        }
                    }
                    .disabled(viewModel.isSaving || viewModel.name.isEmpty || viewModel.interestRate.isEmpty)
                }
            }
        }
    }
}
