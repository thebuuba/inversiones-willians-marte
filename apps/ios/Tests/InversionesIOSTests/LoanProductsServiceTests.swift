import XCTest
@testable import InversionesIOS

final class LoanProductsServiceTests: XCTestCase {
    override func tearDown() {
        LoanProductsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testListReturnsDecodedProducts() async throws {
        LoanProductsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/loan-products")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": [
                {
                  "id": "product-1",
                  "name": "Personal",
                  "interestType": "FLAT",
                  "interestRate": 10,
                  "paymentFrequency": "MONTHLY",
                  "maxTerm": 12
                }
              ]
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = LoanProductsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .loanProductsStubbed)
        )

        let products = try await service.list(accessToken: "token-123")

        XCTAssertEqual(products.first?.name, "Personal")
        XCTAssertEqual(products.first?.interestRate, 10)
    }
}

private final class LoanProductsURLProtocolStub: URLProtocol {
    nonisolated(unsafe) static var handler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        do {
            let (response, data) = try Self.handler?(request) ?? {
                throw URLError(.badServerResponse)
            }()
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

private extension URLSessionConfiguration {
    static var loanProductsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [LoanProductsURLProtocolStub.self]
        return configuration
    }
}
