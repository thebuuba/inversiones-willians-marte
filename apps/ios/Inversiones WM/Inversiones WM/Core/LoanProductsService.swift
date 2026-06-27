import Foundation
import Combine

public struct LoanProductsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func list(accessToken: String) async throws -> [LoanProductItem] {
        let request = try APIClient.loanProductsRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<[LoanProductItem]>.self, from: data)
        return wrapped.data ?? []
    }

    public func create(accessToken: String, input: CreateLoanProductInput) async throws -> LoanProductItem {
        let request = try APIClient.createLoanProductRequest(baseURL: baseURL, accessToken: accessToken, input: input)
        return try await sendMutation(request)
    }

    public func update(accessToken: String, id: String, input: CreateLoanProductInput) async throws -> LoanProductItem {
        let request = try APIClient.updateLoanProductRequest(baseURL: baseURL, accessToken: accessToken, id: id, input: input)
        return try await sendMutation(request)
    }

    public func delete(accessToken: String, id: String) async throws {
        let request = try APIClient.deleteLoanProductRequest(baseURL: baseURL, accessToken: accessToken, id: id)
        _ = try await sendMutation(request)
    }

    private func sendMutation(_ request: URLRequest) async throws -> LoanProductItem {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<LoanProductItem>.self, from: data)
        guard let product = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return product
    }
}

@MainActor
public final class LoanProductsSettingsViewModel: ObservableObject {
    public typealias LoadProductsAction = (String) async throws -> [LoanProductItem]
    public typealias CreateProductAction = (String, CreateLoanProductInput) async throws -> LoanProductItem
    public typealias UpdateProductAction = (String, String, CreateLoanProductInput) async throws -> LoanProductItem
    public typealias DeleteProductAction = (String, String) async throws -> Void

    @Published public private(set) var products: [LoanProductItem] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var isSaving = false
    @Published public private(set) var errorMessage: String?
    @Published public var editingProduct: LoanProductItem?
    @Published public var name = ""
    @Published public var interestType = "FLAT"
    @Published public var interestRate = ""
    @Published public var paymentFrequency = "MONTHLY"
    @Published public var maxTerm = ""

    private let accessToken: String
    private let loadProductsAction: LoadProductsAction
    private let createProductAction: CreateProductAction
    private let updateProductAction: UpdateProductAction
    private let deleteProductAction: DeleteProductAction

    public convenience init(accessToken: String, service: LoanProductsService) {
        self.init(
            accessToken: accessToken,
            loadProducts: { try await service.list(accessToken: $0) },
            createProduct: { try await service.create(accessToken: $0, input: $1) },
            updateProduct: { try await service.update(accessToken: $0, id: $1, input: $2) },
            deleteProduct: { try await service.delete(accessToken: $0, id: $1) }
        )
    }

    public init(
        accessToken: String,
        loadProducts: @escaping LoadProductsAction,
        createProduct: @escaping CreateProductAction,
        updateProduct: @escaping UpdateProductAction,
        deleteProduct: @escaping DeleteProductAction
    ) {
        self.accessToken = accessToken
        loadProductsAction = loadProducts
        createProductAction = createProduct
        updateProductAction = updateProduct
        deleteProductAction = deleteProduct
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        do {
            products = try await loadProductsAction(accessToken)
        } catch {
            errorMessage = "No se pudieron cargar los productos"
        }
        isLoading = false
    }

    public func edit(_ product: LoanProductItem) {
        editingProduct = product
        name = product.name
        interestType = product.interestType
        interestRate = String(format: "%g", product.interestRate)
        paymentFrequency = product.paymentFrequency
        maxTerm = product.maxTerm.map(String.init) ?? ""
    }

    public func create() async -> Bool {
        editingProduct = nil
        return await save()
    }

    public func save() async -> Bool {
        guard let input = buildInput() else {
            errorMessage = "Revisa los datos del producto"
            return false
        }

        isSaving = true
        errorMessage = nil
        do {
            if let editingProduct {
                let updated = try await updateProductAction(accessToken, editingProduct.id, input)
                products = products.map { $0.id == updated.id ? updated : $0 }
            } else {
                let created = try await createProductAction(accessToken, input)
                products.insert(created, at: 0)
            }
            clearForm()
            isSaving = false
            return true
        } catch {
            errorMessage = "No se pudo guardar el producto"
            isSaving = false
            return false
        }
    }

    public func delete(_ product: LoanProductItem) async {
        errorMessage = nil
        do {
            try await deleteProductAction(accessToken, product.id)
            products.removeAll { $0.id == product.id }
        } catch {
            errorMessage = "No se pudo desactivar el producto"
        }
    }

    public func clearForm() {
        editingProduct = nil
        name = ""
        interestType = "FLAT"
        interestRate = ""
        paymentFrequency = "MONTHLY"
        maxTerm = ""
    }

    private func buildInput() -> CreateLoanProductInput? {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty, let rate = Double(interestRate), rate >= 0 else {
            return nil
        }

        return CreateLoanProductInput(
            name: trimmedName,
            interestType: interestType,
            interestRate: rate,
            paymentFrequency: paymentFrequency,
            maxTerm: Int(maxTerm)
        )
    }
}
