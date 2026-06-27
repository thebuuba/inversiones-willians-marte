import XCTest
@testable import InversionesIOS

@MainActor
final class LoanProductsSettingsViewModelTests: XCTestCase {
    func testLoadStoresProducts() async {
        let expected = LoanProductItem(id: "product-1", name: "Personal", interestType: "FLAT", interestRate: 10, paymentFrequency: "MONTHLY", maxTerm: 12)
        let viewModel = LoanProductsSettingsViewModel(
            accessToken: "token-123",
            loadProducts: { token in
                XCTAssertEqual(token, "token-123")
                return [expected]
            },
            createProduct: { _, _ in expected },
            updateProduct: { _, _, _ in expected },
            deleteProduct: { _, _ in }
        )

        await viewModel.load()

        XCTAssertEqual(viewModel.products, [expected])
        XCTAssertNil(viewModel.errorMessage)
    }

    func testCreateAddsProductAndClearsForm() async {
        let created = LoanProductItem(id: "product-1", name: "Personal", interestType: "FLAT", interestRate: 10, paymentFrequency: "MONTHLY", maxTerm: 12)
        let viewModel = LoanProductsSettingsViewModel(
            accessToken: "token-123",
            loadProducts: { _ in [] },
            createProduct: { token, input in
                XCTAssertEqual(token, "token-123")
                XCTAssertEqual(input.name, "Personal")
                return created
            },
            updateProduct: { _, _, _ in created },
            deleteProduct: { _, _ in }
        )
        viewModel.name = "Personal"
        viewModel.interestRate = "10"
        viewModel.maxTerm = "12"

        let didCreate = await viewModel.create()

        XCTAssertTrue(didCreate)
        XCTAssertEqual(viewModel.products, [created])
        XCTAssertEqual(viewModel.name, "")
        XCTAssertEqual(viewModel.interestRate, "")
    }

    func testUpdateReplacesProduct() async {
        let original = LoanProductItem(id: "product-1", name: "Personal", interestType: "FLAT", interestRate: 10, paymentFrequency: "MONTHLY", maxTerm: 12)
        let updated = LoanProductItem(id: "product-1", name: "Personal Plus", interestType: "FLAT", interestRate: 12, paymentFrequency: "MONTHLY", maxTerm: 18)
        let viewModel = LoanProductsSettingsViewModel(
            accessToken: "token-123",
            loadProducts: { _ in [original] },
            createProduct: { _, _ in original },
            updateProduct: { _, id, input in
                XCTAssertEqual(id, "product-1")
                XCTAssertEqual(input.name, "Personal Plus")
                return updated
            },
            deleteProduct: { _, _ in }
        )
        await viewModel.load()
        viewModel.edit(original)
        viewModel.name = "Personal Plus"
        viewModel.interestRate = "12"
        viewModel.maxTerm = "18"

        let didSave = await viewModel.save()

        XCTAssertTrue(didSave)
        XCTAssertEqual(viewModel.products, [updated])
    }

    func testDeleteRemovesProduct() async {
        let product = LoanProductItem(id: "product-1", name: "Personal", interestType: "FLAT", interestRate: 10, paymentFrequency: "MONTHLY", maxTerm: 12)
        let viewModel = LoanProductsSettingsViewModel(
            accessToken: "token-123",
            loadProducts: { _ in [product] },
            createProduct: { _, _ in product },
            updateProduct: { _, _, _ in product },
            deleteProduct: { token, id in
                XCTAssertEqual(token, "token-123")
                XCTAssertEqual(id, "product-1")
            }
        )
        await viewModel.load()

        await viewModel.delete(product)

        XCTAssertTrue(viewModel.products.isEmpty)
    }
}
