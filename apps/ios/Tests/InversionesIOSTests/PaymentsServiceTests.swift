import XCTest
@testable import InversionesIOS

final class PaymentsServiceTests: XCTestCase {
    override func tearDown() {
        PaymentsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testCreateReturnsDecodedPayment() async throws {
        PaymentsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/payments")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": "payment-1",
                "loanId": "loan-1",
                "clientId": 1,
                "amount": 500,
                "paymentDate": "2026-06-26T00:00:00.000Z",
                "paymentMethod": "cash",
                "reference": null,
                "receivedById": "user-1",
                "notes": "abono",
                "createdAt": "2026-06-26T00:00:00.000Z"
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = PaymentsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .paymentsStubbed)
        )

        let payment = try await service.create(
            accessToken: "token-123",
            input: CreatePaymentInput(
                loanId: "loan-1",
                clientId: 1,
                amount: 500,
                paymentDate: "2026-06-26",
                paymentMethod: "cash",
                notes: "abono"
            )
        )

        XCTAssertEqual(payment.id, "payment-1")
        XCTAssertEqual(payment.amount, 500)
    }
}

private final class PaymentsURLProtocolStub: URLProtocol {
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
    static var paymentsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [PaymentsURLProtocolStub.self]
        return configuration
    }
}
